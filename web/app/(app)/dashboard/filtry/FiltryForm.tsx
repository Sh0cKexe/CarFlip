"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import { Sekce, Pole, CenovePole, input, btnPrimary, btnGhost, btnDanger } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";
import { useKurz, prevod, type Mena } from "@/lib/kurz";

const MapaOkruhy = dynamic(() => import("@/app/components/MapaOkruhy"), { ssr: false });

type Zeme = "pl" | "cz" | "sk" | "de" | "at" | "it";
type CenaRozsah = { min: number; max: number | null };
type Oblast = {
  nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number;
  zeme?: Zeme;
};

type Filtry = {
  znacky: string[];
  palivo: string;
  prevodovka: string;
  oblasti: Oblast[];
  min_rok: number;
  max_najezd_nafta: number;
  max_najezd_benzin: number;
  max_cena_pln: number;
  min_cena_pln: number;
  max_cena_eur: number;
  min_cena_eur: number;
  zdroje: Zeme[];
  cena_cz: CenaRozsah;
  cena_sk: CenaRozsah;
};

type Nastaveni = {
  user_id: string;
  filtry: Filtry;
  trh: Trh;
  min_zisk_kc: number;
  naklady_dovoz_kc: number;
  min_srovnani: number;
  posledni_najdi_ted?: string | null;
};

const ZNAME_ZNACKY = [
  "abarth", "acura", "aixam", "alfa-romeo", "alpine", "asia", "aston-martin",
  "audi", "austin", "baw", "bentley", "bmw", "brilliance", "buick", "byd",
  "cadillac", "casalini", "chatenet", "chevrolet", "chrysler", "citroen",
  "cupra", "dacia", "daewoo", "daihatsu", "dodge", "dr-automobiles",
  "ds-automobiles", "ferrari", "fiat", "fisker", "ford", "gaz", "gmc",
  "great-wall", "honda", "hummer", "hyundai", "infiniti", "isuzu", "iveco",
  "jaguar", "jeep", "kia", "ktm", "lada", "lamborghini", "lancia",
  "land-rover", "leapmotor", "lexus", "ligier", "lincoln", "lotus",
  "mahindra", "maserati", "maxus", "maybach", "mazda", "mclaren",
  "mercedes-benz", "mg", "microcar", "mini", "mitsubishi", "morgan",
  "nissan", "oldsmobile", "opel", "peugeot", "plymouth", "polestar",
  "pontiac", "porsche", "renault", "rolls-royce", "rover", "saab", "seat",
  "skoda", "smart", "ssangyong", "subaru", "suzuki", "tata", "tesla",
  "toyota", "uaz", "volkswagen", "volvo", "zastava",
].sort();

export default function FiltryForm({ nastaveni }: { nastaveni: Nastaveni | null }) {
  const supabase = createClient();
  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? {
      user_id: "", trh: "cz",
      filtry: {
        znacky: [], palivo: "vse", prevodovka: "vse", oblasti: [],
        min_rok: 2003, max_najezd_nafta: 250000, max_najezd_benzin: 200000,
        max_cena_pln: 12501, min_cena_pln: 0,
        max_cena_eur: 3000, min_cena_eur: 0,
        zdroje: ["pl"], cena_cz: { min: 0, max: null }, cena_sk: { min: 0, max: null },
      },
      min_zisk_kc: 20000, naklady_dovoz_kc: 10000, min_srovnani: 3,
    }
  );
  const t = T(n.trh);
  const kurz = useKurz();
  const domovskaMena: Mena = n.trh === "sk" ? "EUR" : "CZK";
  const domovskaJednotka = domovskaMena === "EUR" ? "€" : "Kč";
  const bezJednotky = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);
  const [hledatZnacku, setHledatZnacku] = useState("");
  const zdroje = n.filtry.zdroje ?? ["pl"];
  const [najdiTedBezi, setNajdiTedBezi] = useState(false);
  const [najdiTedZprava, setNajdiTedZprava] = useState<string | null>(null);

  async function najitTed() {
    setNajdiTedBezi(true);
    setNajdiTedZprava(null);
    try {
      const r = await fetch("/api/najdi-ted", { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        if (j.zbyvaMinut) {
          setNajdiTedZprava(`${t.najdiTedCooldown} ${j.zbyvaMinut} ${t.najdiTedMinut}`);
        } else {
          setNajdiTedZprava("Chyba: " + (j.error || "neznámá"));
        }
        return;
      }
      setNajdiTedZprava(t.najdiTedSpusteno);
    } catch (e: any) {
      setNajdiTedZprava("Chyba sítě: " + e.message);
    } finally {
      setNajdiTedBezi(false);
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
      { nazev: j.nazev, mesto_slug: j.slug, okruh_km: 50, lat, lon, zeme: j.zeme },
    ]);
  }
  function odebratOblast(i: number) {
    setFiltr("oblasti", n.filtry.oblasti.filter((_, idx) => idx !== i));
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
            disabled={najdiTedBezi}
            className={btnPrimary}
          >
            {najdiTedBezi ? t.najdiTedSpoustim : `🔎 ${t.najdiTed}`}
          </button>
          {najdiTedZprava && (
            <span className={`text-sm ${najdiTedZprava.startsWith("Chyba") ? "text-red-400" : "text-accent"}`}>
              {najdiTedZprava}
            </span>
          )}
        </div>

        <Sekce titulek={t.zdrojoveTrhy}>
          <p className="mb-3 text-xs text-zinc-400">{t.zdrojoveTrhyInfo}</p>
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
                {popisek}
              </label>
            ))}
          </div>
        </Sekce>

        <Sekce titulek={t.znacky}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-zinc-300">
              {vybraneZname.size} {t.vybrano}
            </p>
            <input
              placeholder={t.hledatZnacku}
              value={hledatZnacku}
              onChange={(e) => setHledatZnacku(e.target.value)}
              className="w-44 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs outline-none ring-accent2 focus:ring-2"
            />
          </div>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border bg-panel2/40 p-2 sm:grid-cols-4">
            {filtrovaneZname.length === 0 && (
              <p className="col-span-full py-4 text-center text-sm text-zinc-500">{t.zadnaZnacka}</p>
            )}
            {filtrovaneZname.map((z) => (
              <label
                key={z}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Pole label={t.palivo}>
              <select className={input} value={n.filtry.palivo} onChange={(e) => setFiltr("palivo", e.target.value)}>
                <option value="vse">{t.vse}</option>
                <option value="benzin">{t.benzin}</option>
                <option value="diesel">{t.diesel}</option>
              </select>
            </Pole>
            <Pole label={t.prevodovka}>
              <select className={input} value={n.filtry.prevodovka} onChange={(e) => setFiltr("prevodovka", e.target.value)}>
                <option value="vse">{t.vse}</option>
                <option value="manual">{t.manual}</option>
                <option value="automat">{t.automat}</option>
              </select>
            </Pole>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Pole label={t.rokOd}>
              <input type="number" className={input} value={n.filtry.min_rok} onChange={(e) => setFiltr("min_rok", Number(e.target.value))} />
            </Pole>
            <Pole label={t.maxNajezdDiesel}>
              <input type="number" className={input} value={n.filtry.max_najezd_nafta} onChange={(e) => setFiltr("max_najezd_nafta", Number(e.target.value))} />
            </Pole>
            <Pole label={t.maxNajezdBenzin}>
              <input type="number" className={input} value={n.filtry.max_najezd_benzin} onChange={(e) => setFiltr("max_najezd_benzin", Number(e.target.value))} />
            </Pole>
          </div>

          {zdroje.includes("pl") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CenovePole
                label={bezJednotky(t.cenaPlOd)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={Math.round(prevod(n.filtry.min_cena_pln, "PLN", domovskaMena, kurz))}
                jednotkaNativni="PLN" hodnotaNativniHint={n.filtry.min_cena_pln}
                onChange={(v) => setFiltr("min_cena_pln", Math.round(prevod(v ?? 0, domovskaMena, "PLN", kurz)))}
              />
              <CenovePole
                label={bezJednotky(t.cenaPlDo)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={Math.round(prevod(n.filtry.max_cena_pln, "PLN", domovskaMena, kurz))}
                jednotkaNativni="PLN" hodnotaNativniHint={n.filtry.max_cena_pln}
                onChange={(v) => setFiltr("max_cena_pln", Math.round(prevod(v ?? 0, domovskaMena, "PLN", kurz)))}
              />
            </div>
          )}

          {zdroje.includes("cz") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CenovePole
                label={bezJednotky(t.cenaCzOd)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={Math.round(prevod(n.filtry.cena_cz?.min ?? 0, "CZK", domovskaMena, kurz))}
                jednotkaNativni="Kč" hodnotaNativniHint={n.filtry.cena_cz?.min ?? 0}
                onChange={(v) => setFiltr("cena_cz", { ...n.filtry.cena_cz, min: Math.round(prevod(v ?? 0, domovskaMena, "CZK", kurz)) })}
              />
              <CenovePole
                label={bezJednotky(t.cenaCzDo)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={n.filtry.cena_cz?.max == null ? null : Math.round(prevod(n.filtry.cena_cz.max, "CZK", domovskaMena, kurz))}
                jednotkaNativni="Kč" hodnotaNativniHint={n.filtry.cena_cz?.max ?? null}
                onChange={(v) => setFiltr("cena_cz", { ...n.filtry.cena_cz, max: v == null ? null : Math.round(prevod(v, domovskaMena, "CZK", kurz)) })}
              />
            </div>
          )}

          {zdroje.includes("sk") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CenovePole
                label={bezJednotky(t.cenaSkOd)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={Math.round(prevod(n.filtry.cena_sk?.min ?? 0, "EUR", domovskaMena, kurz))}
                jednotkaNativni="€" hodnotaNativniHint={n.filtry.cena_sk?.min ?? 0}
                onChange={(v) => setFiltr("cena_sk", { ...n.filtry.cena_sk, min: Math.round(prevod(v ?? 0, domovskaMena, "EUR", kurz)) })}
              />
              <CenovePole
                label={bezJednotky(t.cenaSkDo)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={n.filtry.cena_sk?.max == null ? null : Math.round(prevod(n.filtry.cena_sk.max, "EUR", domovskaMena, kurz))}
                jednotkaNativni="€" hodnotaNativniHint={n.filtry.cena_sk?.max ?? null}
                onChange={(v) => setFiltr("cena_sk", { ...n.filtry.cena_sk, max: v == null ? null : Math.round(prevod(v, domovskaMena, "EUR", kurz)) })}
              />
            </div>
          )}

          {(zdroje.includes("de") || zdroje.includes("at") || zdroje.includes("it")) && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CenovePole
                label={bezJednotky(t.cenaZahranicniOd)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={Math.round(prevod(n.filtry.min_cena_eur, "EUR", domovskaMena, kurz))}
                jednotkaNativni="€" hodnotaNativniHint={n.filtry.min_cena_eur}
                onChange={(v) => setFiltr("min_cena_eur", Math.round(prevod(v ?? 0, domovskaMena, "EUR", kurz)))}
              />
              <CenovePole
                label={bezJednotky(t.cenaZahranicniDo)} jednotkaDomovska={domovskaJednotka}
                hodnotaDomovska={Math.round(prevod(n.filtry.max_cena_eur, "EUR", domovskaMena, kurz))}
                jednotkaNativni="€" hodnotaNativniHint={n.filtry.max_cena_eur}
                onChange={(v) => setFiltr("max_cena_eur", Math.round(prevod(v ?? 0, domovskaMena, "EUR", kurz)))}
              />
            </div>
          )}
        </Sekce>

        <Sekce titulek={t.oblasti}>
          <MapaOkruhy oblasti={n.filtry.oblasti} onKlik={pridatOblastZMapy} />
          <div className="space-y-3">
            {n.filtry.oblasti.map((o, i) => (
              <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-lg border border-border bg-panel2 p-3 sm:grid-cols-[80px_1fr_100px_auto]">
                <Pole label={t.zeme}>
                  <select
                    className={input} value={o.zeme ?? "pl"}
                    onChange={(e) => upravitOblast(i, "zeme", e.target.value)}
                  >
                    <option value="pl">PL</option>
                    <option value="cz">CZ</option>
                    <option value="sk">SK</option>
                  </select>
                </Pole>
                <Pole label={t.nazev}>
                  <input className={input} value={o.nazev} onChange={(e) => upravitOblast(i, "nazev", e.target.value)} />
                </Pole>
                <Pole label={t.okruhKm}>
                  <input type="number" className={input} value={o.okruh_km} onChange={(e) => upravitOblast(i, "okruh_km", Number(e.target.value))} />
                </Pole>
                <button type="button" onClick={() => odebratOblast(i)} className={`h-fit ${btnDanger}`}>
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
