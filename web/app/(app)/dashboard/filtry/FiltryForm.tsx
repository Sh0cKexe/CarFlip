"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import { Sekce, Pole, input, btnPrimary, btnGhost, btnDanger } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

const MapaOkruhy = dynamic(() => import("@/app/components/MapaOkruhy"), { ssr: false });

type Zeme = "pl" | "cz" | "sk";
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

const ZEME_VLAJKA: Record<Zeme, string> = { pl: "🇵🇱 PL", cz: "🇨🇿 CZ", sk: "🇸🇰 SK" };

export default function FiltryForm({ nastaveni }: { nastaveni: Nastaveni | null }) {
  const supabase = createClient();
  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? {
      user_id: "", trh: "cz",
      filtry: {
        znacky: [], palivo: "vse", prevodovka: "vse", oblasti: [],
        min_rok: 2003, max_najezd_nafta: 250000, max_najezd_benzin: 200000,
        max_cena_pln: 12501, min_cena_pln: 0,
        zdroje: ["pl"], cena_cz: { min: 0, max: null }, cena_sk: { min: 0, max: null },
      },
      min_zisk_kc: 20000, naklady_dovoz_kc: 10000, min_srovnani: 3,
    }
  );
  const t = T(n.trh);
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);
  const [hledatZnacku, setHledatZnacku] = useState("");
  const zdroje = n.filtry.zdroje ?? ["pl"];
  const [novaOblastZeme, setNovaOblastZeme] = useState<Zeme>("pl");

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
    setFiltr("oblasti", [...n.filtry.oblasti, { nazev: "", mesto_slug: "", okruh_km: 50, zeme: novaOblastZeme }]);
  }
  async function pridatOblastZMapy(lat: number, lon: number) {
    const r = await fetch("/api/geokod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, zeme: novaOblastZeme }),
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
      <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.filtryHledani}</h1>

        <Sekce titulek={t.zdrojoveTrhy}>
          <p className="mb-3 text-xs text-zinc-400">{t.zdrojoveTrhyInfo}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ["pl", t.zdrojPolsko],
              ["cz", t.zdrojCesko],
              ["sk", t.zdrojSlovensko],
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
              <Pole label={t.cenaPlOd}>
                <input type="number" className={input} value={n.filtry.min_cena_pln} onChange={(e) => setFiltr("min_cena_pln", Number(e.target.value))} />
              </Pole>
              <Pole label={t.cenaPlDo}>
                <input type="number" className={input} value={n.filtry.max_cena_pln} onChange={(e) => setFiltr("max_cena_pln", Number(e.target.value))} />
              </Pole>
            </div>
          )}

          {zdroje.includes("cz") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Pole label={t.cenaCzOd}>
                <input
                  type="number" className={input} value={n.filtry.cena_cz?.min ?? 0}
                  onChange={(e) => setFiltr("cena_cz", { ...n.filtry.cena_cz, min: Number(e.target.value) })}
                />
              </Pole>
              <Pole label={t.cenaCzDo}>
                <input
                  type="number" className={input} value={n.filtry.cena_cz?.max ?? ""}
                  onChange={(e) => setFiltr("cena_cz", { ...n.filtry.cena_cz, max: e.target.value ? Number(e.target.value) : null })}
                />
              </Pole>
            </div>
          )}

          {zdroje.includes("sk") && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Pole label={t.cenaSkOd}>
                <input
                  type="number" className={input} value={n.filtry.cena_sk?.min ?? 0}
                  onChange={(e) => setFiltr("cena_sk", { ...n.filtry.cena_sk, min: Number(e.target.value) })}
                />
              </Pole>
              <Pole label={t.cenaSkDo}>
                <input
                  type="number" className={input} value={n.filtry.cena_sk?.max ?? ""}
                  onChange={(e) => setFiltr("cena_sk", { ...n.filtry.cena_sk, max: e.target.value ? Number(e.target.value) : null })}
                />
              </Pole>
            </div>
          )}
        </Sekce>

        <Sekce titulek={t.oblasti}>
          {zdroje.length > 1 && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-zinc-400">{t.zeme}:</span>
              {zdroje.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setNovaOblastZeme(z)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    novaOblastZeme === z ? "bg-panel2 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {ZEME_VLAJKA[z]}
                </button>
              ))}
            </div>
          )}
          <MapaOkruhy oblasti={n.filtry.oblasti} onKlik={pridatOblastZMapy} />
          <div className="space-y-3">
            {n.filtry.oblasti.map((o, i) => (
              <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-lg border border-border bg-panel2 p-3 sm:grid-cols-[80px_1fr_1fr_100px_auto]">
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
                <Pole label={t.slugMesta}>
                  <input className={input} value={o.mesto_slug} onChange={(e) => upravitOblast(i, "mesto_slug", e.target.value)} />
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
