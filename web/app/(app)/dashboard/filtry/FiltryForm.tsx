"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import { Sekce, Pole, CenovePole, VicevyberMenu, input, btnPrimary, btnGhost, btnDanger } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";
import { useKurz, prevod, type Mena } from "@/lib/kurz";
import { BARVA_ZEME } from "@/lib/zemeBarvy";

const MapaOkruhy = dynamic(() => import("@/app/components/MapaOkruhy"), { ssr: false });

type Zeme = "pl" | "cz" | "sk" | "de" | "at" | "it";
type CenaRozsah = { min: number; max: number | null };
type Oblast = {
  nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number;
  zeme?: Zeme;
  plz?: string;     // PSC - jen DE/IT (AutoScout24 zip+radius)
  areaId?: number;  // spolkova zeme - jen AT (Willhaben nema radius, jen kraje)
};

type Filtry = {
  znacky: string[];
  palivo: string[];
  prevodovka: string;
  oblasti: Oblast[];
  min_rok: number;
  max_rok: number | null;
  karoserie: string[];
  min_najezd_nafta: number;
  max_najezd_nafta: number;
  min_najezd_benzin: number;
  max_najezd_benzin: number;
  max_cena_pln: number;
  min_cena_pln: number;
  zdroje: Zeme[];
  cena_cz: CenaRozsah;
  cena_sk: CenaRozsah;
  cena_de: CenaRozsah;
  cena_at: CenaRozsah;
  cena_it: CenaRozsah;
};

function Vlajka({ zeme, className }: { zeme: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/h20/${zeme}.png`}
      alt={zeme.toUpperCase()}
      className={className ?? "inline-block h-3.5 w-auto rounded-[2px]"}
    />
  );
}

type Nastaveni = {
  user_id: string;
  filtry: Filtry;
  trh: Trh;
  min_zisk_kc: number;
  naklady_dovoz_kc: number;
  min_srovnani: number;
  posledni_najdi_ted?: string | null;
  najdi_ted_stav?: string | null;
  najdi_ted_spusteno?: string | null;
};

const NAJDI_TED_COOLDOWN_MIN = 60;

const ZNAME_ZNACKY = [
  "abarth", "alfa-romeo", "alpine", "aston-martin",
  "audi", "austin", "bentley", "bmw", "buick", "byd",
  "cadillac", "chevrolet", "chrysler", "citroen",
  "cupra", "dacia", "daewoo", "daihatsu", "dodge",
  "ds-automobiles", "ferrari", "fiat", "fisker", "ford", "gmc",
  "honda", "hummer", "hyundai", "infiniti", "isuzu", "iveco",
  "jaguar", "jeep", "kia", "ktm", "lada", "lamborghini", "lancia",
  "land-rover", "leapmotor", "lexus", "lincoln", "lotus",
  "maserati", "maxus", "maybach", "mazda", "mclaren",
  "mercedes-benz", "mg", "mini", "mitsubishi", "morgan",
  "nissan", "oldsmobile", "opel", "peugeot", "polestar",
  "pontiac", "porsche", "renault", "rolls-royce", "rover", "saab", "seat",
  "skoda", "smart", "ssangyong", "subaru", "suzuki", "tata", "tesla",
  "toyota", "volkswagen", "volvo",
].sort();

export default function FiltryForm({ nastaveni, jeAdmin }: { nastaveni: Nastaveni | null; jeAdmin?: boolean }) {
  const supabase = createClient();
  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? {
      user_id: "", trh: "cz",
      filtry: {
        znacky: [], palivo: [], prevodovka: "vse", oblasti: [],
        min_rok: 2003, max_rok: null, karoserie: [],
        min_najezd_nafta: 0, max_najezd_nafta: 250000,
        min_najezd_benzin: 0, max_najezd_benzin: 200000,
        max_cena_pln: 12501, min_cena_pln: 0,
        zdroje: ["pl"], cena_cz: { min: 0, max: null }, cena_sk: { min: 0, max: null },
        cena_de: { min: 0, max: 3000 }, cena_at: { min: 0, max: 3000 }, cena_it: { min: 0, max: 3000 },
      },
      min_zisk_kc: 20000, naklady_dovoz_kc: 10000, min_srovnani: 3,
    }
  );
  const t = T(n.trh);
  const kurz = useKurz();
  const domovskaMena: Mena = n.trh === "sk" ? "EUR" : "CZK";
  const domovskaJednotka = domovskaMena === "EUR" ? "€" : "Kč";
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);
  const [hledatZnacku, setHledatZnacku] = useState("");
  const [hledaSeOblast, setHledaSeOblast] = useState<number | null>(null);
  const zdroje = n.filtry.zdroje ?? ["pl"];
  const [najdiTedOdesilani, setNajdiTedOdesilani] = useState(false);
  const [najdiTedStav, setNajdiTedStav] = useState<string | null>(n.najdi_ted_stav ?? null);
  const [posledniDokonceni, setPosledniDokonceni] = useState<string | null>(n.posledni_najdi_ted ?? null);
  const [najdiTedSpusteno, setNajdiTedSpusteno] = useState<string | null>(n.najdi_ted_spusteno ?? null);
  const [najdiTedChyba, setNajdiTedChyba] = useState<string | null>(null);
  const [ted, setTed] = useState(() => Date.now());

  // Tikajici hodiny pro live countdown cooldownu + dobu behu (kazdou sekundu).
  useEffect(() => {
    const id = setInterval(() => setTed(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Kdyz beh bezi, kazde 4s zkontroluj stav primo v Supabase (RLS dovoli
  // cist jen svuj radek) - az najdi_ted_cloud.py dopise hotovo/chyba na
  // konci, prestane se pollovat a zacne tikat cooldown.
  useEffect(() => {
    if (najdiTedStav !== "bezi") return;
    const id = setInterval(async () => {
      const { data } = await supabase
        .from("nastaveni")
        .select("najdi_ted_stav, posledni_najdi_ted, najdi_ted_spusteno")
        .eq("user_id", n.user_id)
        .single();
      if (data) {
        setNajdiTedStav(data.najdi_ted_stav ?? null);
        setPosledniDokonceni(data.posledni_najdi_ted ?? null);
        setNajdiTedSpusteno(data.najdi_ted_spusteno ?? null);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [najdiTedStav, supabase, n.user_id]);

  const zbyvaSekund = !jeAdmin && posledniDokonceni
    ? Math.max(0, Math.ceil((new Date(posledniDokonceni).getTime() + NAJDI_TED_COOLDOWN_MIN * 60000 - ted) / 1000))
    : 0;
  const bezitSekund = najdiTedSpusteno
    ? Math.max(0, Math.floor((ted - new Date(najdiTedSpusteno).getTime()) / 1000))
    : 0;

  async function najitTed() {
    setNajdiTedOdesilani(true);
    setNajdiTedChyba(null);
    try {
      const r = await fetch("/api/najdi-ted", { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        if (j.zbyvaMinut) {
          setNajdiTedChyba(`${t.najdiTedCooldown} ${j.zbyvaMinut} ${t.najdiTedMinut}`);
        } else if (j.error !== "bezi") {
          setNajdiTedChyba("Chyba: " + (j.error || "neznámá"));
        }
        return;
      }
      setNajdiTedStav("bezi");
      setNajdiTedSpusteno(new Date().toISOString());
    } catch (e: any) {
      setNajdiTedChyba("Chyba sítě: " + e.message);
    } finally {
      setNajdiTedOdesilani(false);
    }
  }

  const vybraneZname = useMemo(() => new Set(n.filtry.znacky), [n.filtry.znacky]);
  const filtrovaneZname = useMemo(
    () => ZNAME_ZNACKY.filter((z) => z.includes(hledatZnacku.trim().toLowerCase())),
    [hledatZnacku]
  );

  function setFiltr<K extends keyof Filtry>(klic: K, hodnota: Filtry[K]) {
    setN({ ...n, filtry: { ...n.filtry, [klic]: hodnota } });
  }

  function prepnoutZnacku(znacka: string) {
    const aktualni = new Set(n.filtry.znacky);
    if (aktualni.has(znacka)) aktualni.delete(znacka);
    else aktualni.add(znacka);
    setFiltr("znacky", Array.from(aktualni));
  }

  function prepnoutZdroj(zdroj: Zeme) {
    const aktualni = new Set(zdroje);
    if (aktualni.has(zdroj)) aktualni.delete(zdroj);
    else aktualni.add(zdroj);
    setFiltr("zdroje", Array.from(aktualni));
  }

  // Zpetna kompatibilita: stary format byl jednovyberovy string ("vse"/
  // "benzin"/"diesel") - schema.sql migruje na pole, ale dokud uzivatel
  // znovu nespusti schema.sql, muze prijit jeste stary tvar.
  const paliva = Array.isArray(n.filtry.palivo) ? n.filtry.palivo : [];
  function prepnoutPalivo(kategorie: string) {
    const aktualni = new Set(paliva);
    if (aktualni.has(kategorie)) aktualni.delete(kategorie);
    else aktualni.add(kategorie);
    setFiltr("palivo", Array.from(aktualni));
  }

  const karoserie = Array.isArray(n.filtry.karoserie) ? n.filtry.karoserie : [];
  function prepnoutKaroserii(kategorie: string) {
    const aktualni = new Set(karoserie);
    if (aktualni.has(kategorie)) aktualni.delete(kategorie);
    else aktualni.add(kategorie);
    setFiltr("karoserie", Array.from(aktualni));
  }

  function pridatOblast() {
    setFiltr("oblasti", [...n.filtry.oblasti, { nazev: "", mesto_slug: "", okruh_km: 50, zeme: "pl" }]);
  }
  async function pridatOblastZMapy(lat: number, lon: number) {
    const r = await fetch("/api/geokod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });
    const j = await r.json();
    if (!r.ok) {
      setZprava("Geokódování: " + (j.error || "nepodařilo se najít město."));
      return;
    }
    setFiltr("oblasti", [
      ...n.filtry.oblasti,
      { nazev: j.nazev, mesto_slug: j.slug, okruh_km: 50, lat, lon, zeme: j.zeme, plz: j.plz, areaId: j.areaId },
    ]);
  }
  function odebratOblast(i: number) {
    setFiltr("oblasti", n.filtry.oblasti.filter((_, idx) => idx !== i));
  }
  function patchOblast(i: number, zmeny: Partial<Oblast>) {
    const kopie = [...n.filtry.oblasti];
    kopie[i] = { ...kopie[i], ...zmeny };
    setFiltr("oblasti", kopie);
  }
  // Kdyz uzivatel rucne napise/prepise nazev mesta (misto kliku do mapy),
  // po opusteni pole se dohleda dopredne pres /api/geokod (nazev ->
  // souradnice), at se pin objevi/aktualizuje i bez kliku. naposledyRef
  // hlida, jestli se text od fokusu opravdu zmenil - jinak by kazdy
  // odchod z pole (i bez zmeny) zbytecne posilal dotaz na Nominatim a
  // mohl by prepsat presny pin z mapy hruboursi shodou podle nazvu.
  const naposledyZadanyNazevRef = useRef<Record<number, string>>({});
  async function dohledatMestoPodleNazvu(i: number) {
    const o = n.filtry.oblasti[i];
    const nazev = o.nazev.trim();
    if (!nazev) return;
    setHledaSeOblast(i);
    const r = await fetch("/api/geokod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dotaz: nazev }),
    });
    const j = await r.json();
    setHledaSeOblast(null);
    if (!r.ok) {
      setZprava("Geokódování: " + (j.error || "město se nepodařilo najít."));
      return;
    }
    patchOblast(i, { nazev: j.nazev, mesto_slug: j.slug, lat: j.lat, lon: j.lon, zeme: j.zeme, plz: j.plz, areaId: j.areaId });
  }
  function upravitOblast(i: number, klic: keyof Oblast, hodnota: string | number) {
    const kopie = [...n.filtry.oblasti];
    kopie[i] = { ...kopie[i], [klic]: hodnota };
    setFiltr("oblasti", kopie);
  }

  async function ulozit() {
    setUklada(true);
    setZprava(null);
    const { error } = await supabase
      .from("nastaveni")
      .update({
        filtry: n.filtry,
        min_zisk_kc: n.min_zisk_kc,
        naklady_dovoz_kc: n.naklady_dovoz_kc,
        min_srovnani: n.min_srovnani,
      })
      .eq("user_id", n.user_id);
    setUklada(false);
    setZprava(error ? t.chybaUkladani + error.message : t.ulozeno);
  }

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <h1 className="mb-4 text-xl font-semibold text-zinc-100">{t.filtryHledani}</h1>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={najitTed}
            disabled={najdiTedOdesilani || (!jeAdmin && (najdiTedStav === "bezi" || zbyvaSekund > 0))}
            className={btnPrimary}
          >
            {najdiTedOdesilani ? t.najdiTedSpoustim : `🔎 ${t.najdiTed}`}
          </button>
          {najdiTedStav === "bezi" ? (
            <span className="flex items-center gap-2 text-sm text-accent">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              {t.najdiTedBezi} ({Math.floor(bezitSekund / 60)}:{String(bezitSekund % 60).padStart(2, "0")})
            </span>
          ) : najdiTedChyba ? (
            <span className="text-sm text-red-400">{najdiTedChyba}</span>
          ) : najdiTedStav === "chyba" ? (
            <span className="text-sm text-red-400">{t.najdiTedChyba}</span>
          ) : zbyvaSekund > 0 ? (
            <span className="text-sm text-zinc-400">
              {t.najdiTedHotovo} {t.najdiTedCooldown} {Math.floor(zbyvaSekund / 60)}:{String(zbyvaSekund % 60).padStart(2, "0")}
            </span>
          ) : null}
        </div>

        <Sekce titulek={t.zdrojoveTrhy}>
          <p className="mb-3 text-xs text-zinc-400">{t.zdrojoveTrhyInfo}</p>
          {zdroje.length === 0 && (
            <p className="mb-3 text-xs text-red-400">{t.zadnyZdrojVarovani}</p>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ["pl", t.zdrojPolsko],
              ["cz", t.zdrojCesko],
              ["sk", t.zdrojSlovensko],
              ["de", t.zdrojNemecko],
              ["at", t.zdrojRakousko],
              ["it", t.zdrojItalie],
            ] as [Zeme, string][]).map(([zdroj, popisek]) => (
              <label
                key={zdroj}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                  zdroje.includes(zdroj) ? "border-accent bg-accent/10 text-accent" : "border-border bg-panel2 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <input type="checkbox" checked={zdroje.includes(zdroj)} onChange={() => prepnoutZdroj(zdroj)} className="hidden" />
                <Vlajka zeme={zdroj} />
                {popisek}
              </label>
            ))}
          </div>
        </Sekce>

        <Sekce titulek={t.znacky} badge={{ text: `${vybraneZname.size} ${t.vybrano}`, tone: vybraneZname.size > 0 ? "green" : "zinc" }}>
          {vybraneZname.size > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5 rounded-lg border border-accent/20 bg-accent/5 p-2.5">
              {Array.from(vybraneZname).sort().map((z) => (
                <span
                  key={z}
                  className="flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
                >
                  {z}
                  <button type="button" onClick={() => prepnoutZnacku(z)} className="text-accent/70 hover:text-accent" aria-label={t.smazat}>
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setFiltr("znacky", [])}
                className="rounded-full px-2.5 py-1 text-xs text-zinc-400 underline hover:text-zinc-200"
              >
                {t.zrusit}
              </button>
            </div>
          )}
          <input
            placeholder={t.hledatZnacku}
            value={hledatZnacku}
            onChange={(e) => setHledatZnacku(e.target.value)}
            className="mb-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none ring-accent2 focus:ring-2"
          />
          <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto rounded-lg border border-border bg-panel2/40 p-2 sm:grid-cols-4">
            {filtrovaneZname.length === 0 && (
              <p className="col-span-full py-4 text-center text-sm text-zinc-500">{t.zadnaZnacka}</p>
            )}
            {filtrovaneZname.map((z) => (
              <label
                key={z}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                  vybraneZname.has(z) ? "border-accent bg-accent/10 text-accent" : "border-border bg-panel2 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <input type="checkbox" checked={vybraneZname.has(z)} onChange={() => prepnoutZnacku(z)} className="hidden" />
                {z}
              </label>
            ))}
          </div>
        </Sekce>

        <Sekce titulek={t.filtryAut}>
          <div className="grid items-start gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-panel2/40 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">🚘 {t.karoserie} / {t.palivo}</p>
              <div className="grid gap-3">
                <VicevyberMenu
                  label={t.karoserie}
                  vseText={t.vse}
                  vybrane={karoserie}
                  onToggle={prepnoutKaroserii}
                  hodnoty={[
                    ["kombi", t.karoserieKombi],
                    ["sedan", t.karoserieSedan],
                    ["hatchback", t.karoserieHatchback],
                    ["suv", t.karoserieSuv],
                    ["kupe", t.karoserieKupe],
                    ["kabriolet", t.karoserieKabriolet],
                    ["van", t.karoserieVan],
                  ]}
                />
                <VicevyberMenu
                  label={t.palivo}
                  vseText={t.vse}
                  vybrane={paliva}
                  onToggle={prepnoutPalivo}
                  hodnoty={[
                    ["benzin", t.benzin],
                    ["nafta", t.diesel],
                    ["hybrid", t.palivoFiltrHybrid],
                    ["elektro", t.palivoElektroKratce],
                    ["lpg_cng", t.palivoLpgCng],
                  ]}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-panel2/40 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">📅 {t.rokOd} – {t.rokDo} / {t.prevodovka}</p>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Pole label={t.rokOd}>
                    <input type="number" className={input} value={n.filtry.min_rok} onChange={(e) => setFiltr("min_rok", Number(e.target.value))} />
                  </Pole>
                  <Pole label={t.rokDo}>
                    <input
                      type="number" className={input} value={n.filtry.max_rok ?? ""}
                      onChange={(e) => setFiltr("max_rok", e.target.value ? Number(e.target.value) : null)}
                    />
                  </Pole>
                </div>
                {n.filtry.min_rok > new Date().getFullYear() && (
                  <p className="text-xs text-red-400">{t.rokVBudoucnostiVarovani}</p>
                )}
                <Pole label={t.prevodovka}>
                  <select className={input} value={n.filtry.prevodovka} onChange={(e) => setFiltr("prevodovka", e.target.value)}>
                    <option value="vse">{t.vse}</option>
                    <option value="manual">{t.manual}</option>
                    <option value="automat">{t.automat}</option>
                  </select>
                </Pole>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-panel2/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">🛣️ {t.najezd} (km)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs text-zinc-400">{t.najezdNafta}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Pole label="od">
                    <input
                      type="number" className={input} value={n.filtry.min_najezd_nafta ?? 0}
                      onChange={(e) => setFiltr("min_najezd_nafta", Number(e.target.value))}
                    />
                  </Pole>
                  <Pole label="do">
                    <input
                      type="number" className={input} value={n.filtry.max_najezd_nafta ?? 0}
                      onChange={(e) => setFiltr("max_najezd_nafta", Number(e.target.value))}
                    />
                  </Pole>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-zinc-400">{t.najezdBenzinOstatni}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Pole label="od">
                    <input
                      type="number" className={input} value={n.filtry.min_najezd_benzin ?? 0}
                      onChange={(e) => setFiltr("min_najezd_benzin", Number(e.target.value))}
                    />
                  </Pole>
                  <Pole label="do">
                    <input
                      type="number" className={input} value={n.filtry.max_najezd_benzin ?? 0}
                      onChange={(e) => setFiltr("max_najezd_benzin", Number(e.target.value))}
                    />
                  </Pole>
                </div>
              </div>
            </div>
          </div>

          {(() => {
            const JEDNOTKA: Record<Mena, string> = { PLN: "PLN", CZK: "Kč", EUR: "€" };
            function radek(
              zeme: Zeme, label: string, mena: Mena, min: number, max: number | null,
              setMin: (v: number) => void, setMax: (v: number | null) => void
            ) {
              return { zeme, label, mena, min, max, setMin, setMax };
            }
            const zdrojeCen = [
              radek("pl", t.zdrojPolsko.split(" - ")[0], "PLN", n.filtry.min_cena_pln, n.filtry.max_cena_pln,
                (v) => setFiltr("min_cena_pln", v), (v) => setFiltr("max_cena_pln", v ?? 0)),
              radek("cz", t.zdrojCesko.split(" - ")[0], "CZK", n.filtry.cena_cz?.min ?? 0, n.filtry.cena_cz?.max ?? null,
                (v) => setFiltr("cena_cz", { ...n.filtry.cena_cz, min: v }), (v) => setFiltr("cena_cz", { ...n.filtry.cena_cz, max: v })),
              radek("sk", t.zdrojSlovensko.split(" - ")[0], "EUR", n.filtry.cena_sk?.min ?? 0, n.filtry.cena_sk?.max ?? null,
                (v) => setFiltr("cena_sk", { ...n.filtry.cena_sk, min: v }), (v) => setFiltr("cena_sk", { ...n.filtry.cena_sk, max: v })),
              radek("de", t.zdrojNemecko.split(" - ")[0], "EUR", n.filtry.cena_de?.min ?? 0, n.filtry.cena_de?.max ?? null,
                (v) => setFiltr("cena_de", { ...n.filtry.cena_de, min: v }), (v) => setFiltr("cena_de", { ...n.filtry.cena_de, max: v })),
              radek("at", t.zdrojRakousko.split(" - ")[0], "EUR", n.filtry.cena_at?.min ?? 0, n.filtry.cena_at?.max ?? null,
                (v) => setFiltr("cena_at", { ...n.filtry.cena_at, min: v }), (v) => setFiltr("cena_at", { ...n.filtry.cena_at, max: v })),
              radek("it", t.zdrojItalie.split(" - ")[0], "EUR", n.filtry.cena_it?.min ?? 0, n.filtry.cena_it?.max ?? null,
                (v) => setFiltr("cena_it", { ...n.filtry.cena_it, min: v }), (v) => setFiltr("cena_it", { ...n.filtry.cena_it, max: v })),
            ].filter((c) => zdroje.includes(c.zeme));

            if (zdrojeCen.length === 0) return null;
            return (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {zdrojeCen.map((c) => (
                  <div key={c.zeme} className="rounded-lg border border-border bg-panel2/40 p-2.5">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs text-zinc-300">
                      <Vlajka zeme={c.zeme} /> {c.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <CenovePole
                        label="od" jednotkaDomovska={domovskaJednotka}
                        hodnotaDomovska={Math.round(prevod(c.min, c.mena, domovskaMena, kurz))}
                        jednotkaNativni={JEDNOTKA[c.mena]} hodnotaNativniHint={c.min}
                        onChange={(v) => c.setMin(Math.round(prevod(v ?? 0, domovskaMena, c.mena, kurz)))}
                      />
                      <CenovePole
                        label="do" jednotkaDomovska={domovskaJednotka}
                        hodnotaDomovska={c.max == null ? null : Math.round(prevod(c.max, c.mena, domovskaMena, kurz))}
                        jednotkaNativni={JEDNOTKA[c.mena]} hodnotaNativniHint={c.max}
                        onChange={(v) => c.setMax(v == null ? null : Math.round(prevod(v, domovskaMena, c.mena, kurz)))}
                      />
                    </div>
                    {c.max != null && c.max < c.min && (
                      <p className="mt-1.5 text-xs text-red-400">{t.cenaOdDoVarovani}</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </Sekce>

        <Sekce titulek={t.oblasti}>
          <MapaOkruhy oblasti={n.filtry.oblasti} onKlik={pridatOblastZMapy} />
          <div className="space-y-3">
            {n.filtry.oblasti.map((o, i) => (
              <div key={i} className="grid grid-cols-2 items-start gap-2 rounded-lg border border-border bg-panel2 p-3 sm:grid-cols-[16px_80px_1fr_100px_auto]">
                <span
                  className="mt-5 hidden h-2.5 w-2.5 shrink-0 rounded-full sm:block"
                  style={{ backgroundColor: BARVA_ZEME[o.zeme ?? "pl"] }}
                  title={t.zeme}
                />
                <Pole label={t.zeme}>
                  <select
                    className={input} value={o.zeme ?? "pl"}
                    onChange={(e) => upravitOblast(i, "zeme", e.target.value)}
                  >
                    <option value="pl">PL</option>
                    <option value="cz">CZ</option>
                    <option value="sk">SK</option>
                    <option value="de">DE</option>
                    <option value="at">AT</option>
                    <option value="it">IT</option>
                  </select>
                </Pole>
                <Pole label={t.nazev}>
                  <input
                    className={input} value={o.nazev}
                    onFocus={() => { naposledyZadanyNazevRef.current[i] = o.nazev; }}
                    onChange={(e) => upravitOblast(i, "nazev", e.target.value)}
                    onBlur={() => {
                      if (naposledyZadanyNazevRef.current[i] !== o.nazev) dohledatMestoPodleNazvu(i);
                    }}
                  />
                  {hledaSeOblast === i ? (
                    <p className="mt-1 text-xs text-zinc-500">Hledám město…</p>
                  ) : o.lat != null && o.lon != null ? (
                    <p className="mt-1 text-xs text-accent">✓ pin na mapě</p>
                  ) : null}
                  {o.zeme === "de" || o.zeme === "it" ? (
                    <p className="mt-1 text-xs text-zinc-500">PSC: {o.plz ?? "?"}</p>
                  ) : null}
                  {o.zeme && !zdroje.includes(o.zeme) && (
                    <p className="mt-1 text-xs text-red-400">
                      {t.oblastNepouzitaVarovani.replace("{zeme}", o.zeme.toUpperCase())}
                    </p>
                  )}
                </Pole>
                {o.zeme === "at" ? (
                  <Pole label={t.okruhKm}>
                    <p className={`${input} flex items-center text-zinc-400`}>{t.celySpolkovyKraj}</p>
                  </Pole>
                ) : (
                  <Pole label={t.okruhKm}>
                    <input type="number" className={input} value={o.okruh_km} onChange={(e) => upravitOblast(i, "okruh_km", Number(e.target.value))} />
                  </Pole>
                )}
                <button type="button" onClick={() => odebratOblast(i)} className={`mt-5 h-fit ${btnDanger}`}>
                  {t.smazat}
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={pridatOblast} className={`mt-3 ${btnGhost}`}>
            {t.pridatOblast}
          </button>
        </Sekce>

        <Sekce titulek={t.ziskovost}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Pole label={`${t.minimalniZisk} (${t.mena})`}>
              <input type="number" className={input} value={n.min_zisk_kc} onChange={(e) => setN({ ...n, min_zisk_kc: Number(e.target.value) })} />
            </Pole>
            <Pole label={`${t.nakladyDovoz} (${t.mena})`}>
              <input type="number" className={input} value={n.naklady_dovoz_kc} onChange={(e) => setN({ ...n, naklady_dovoz_kc: Number(e.target.value) })} />
            </Pole>
            <Pole label={t.minSrovnatelnych}>
              <input type="number" className={input} value={n.min_srovnani} onChange={(e) => setN({ ...n, min_srovnani: Number(e.target.value) })} />
            </Pole>
          </div>
        </Sekce>

        <button onClick={ulozit} disabled={uklada} className={btnPrimary}>
          {uklada ? t.ukladam : t.ulozitNastaveni}
        </button>
        {zprava && (
          <p className={`mt-3 text-sm ${zprava.startsWith("Chyb") || zprava.startsWith("Geo") ? "text-red-400" : "text-accent"}`}>{zprava}</p>
      )}
    </main>
  );
}
