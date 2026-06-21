"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import Nav from "@/app/components/Nav";
import { Sekce, Pole, input } from "@/app/components/FormUI";

const MapaOkruhy = dynamic(() => import("@/app/components/MapaOkruhy"), { ssr: false });

type Oblast = { nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number };

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
};

type Nastaveni = {
  user_id: string;
  telegram_token: string;
  telegram_chat_id: string;
  dalsi_prijemci: string[];
  filtry: Filtry;
  min_zisk_kc: number;
  naklady_dovoz_kc: number;
  min_srovnani: number;
  aktivni: boolean;
};

// Kompletni seznam znacek (slugy presne jako v URL Otomoto.pl/osobowe/<slug>).
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

export default function DashboardForm({ email, nastaveni }: { email: string; nastaveni: Nastaveni | null }) {
  const supabase = createClient();

  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? {
      user_id: "",
      telegram_token: "",
      telegram_chat_id: "",
      dalsi_prijemci: [],
      filtry: {
        znacky: [], palivo: "vse", prevodovka: "vse", oblasti: [],
        min_rok: 2003, max_najezd_nafta: 250000, max_najezd_benzin: 200000,
        max_cena_pln: 12501, min_cena_pln: 0,
      },
      min_zisk_kc: 20000, naklady_dovoz_kc: 10000, min_srovnani: 3, aktivni: true,
    }
  );
  const [vlastniZnacky, setVlastniZnacky] = useState(
    () => n.filtry.znacky.filter((z) => !ZNAME_ZNACKY.includes(z)).join(", ")
  );
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);
  const [testuje, setTestuje] = useState(false);
  const [hledatZnacku, setHledatZnacku] = useState("");

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

  function ulozitVlastniZnacky(text: string) {
    setVlastniZnacky(text);
    const vlastni = text.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const zname = n.filtry.znacky.filter((z) => ZNAME_ZNACKY.includes(z));
    setFiltr("znacky", Array.from(new Set([...zname, ...vlastni])));
  }

  function pridatOblast() {
    setFiltr("oblasti", [...n.filtry.oblasti, { nazev: "", mesto_slug: "", okruh_km: 50 }]);
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
      { nazev: j.nazev, mesto_slug: j.slug, okruh_km: 50, lat, lon },
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
        telegram_token: n.telegram_token,
        telegram_chat_id: n.telegram_chat_id,
        dalsi_prijemci: n.dalsi_prijemci,
        filtry: n.filtry,
        min_zisk_kc: n.min_zisk_kc,
        naklady_dovoz_kc: n.naklady_dovoz_kc,
        min_srovnani: n.min_srovnani,
        aktivni: n.aktivni,
      })
      .eq("user_id", n.user_id);
    setUklada(false);
    setZprava(error ? "Chyba při ukládání: " + error.message : "Uloženo.");
  }

  async function testSpojeni() {
    setTestuje(true);
    setZprava(null);
    try {
      const r = await fetch(`https://api.telegram.org/bot${n.telegram_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: n.telegram_chat_id, text: "✅ CarFlip – test spojení funguje!" }),
      });
      const j = await r.json();
      setZprava(j.ok ? "Test OK, zpráva odeslána na Telegram." : "Telegram chyba: " + (j.description || "neznámá"));
    } catch (e: any) {
      setZprava("Chyba sítě: " + e.message);
    } finally {
      setTestuje(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Nav email={email} />

      <Sekce titulek="Telegram bot" badge={n.aktivni ? { text: "aktivní", tone: "green" } : { text: "pozastaveno", tone: "zinc" }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Pole label="Token bota">
            <input className={input} value={n.telegram_token} onChange={(e) => setN({ ...n, telegram_token: e.target.value })} />
          </Pole>
          <Pole label="Tvoje chat ID">
            <input className={input} value={n.telegram_chat_id} onChange={(e) => setN({ ...n, telegram_chat_id: e.target.value })} />
          </Pole>
        </div>
        <Pole label="Další příjemci (chat ID, čárkou)">
          <input
            className={input}
            value={n.dalsi_prijemci.join(", ")}
            onChange={(e) => setN({ ...n, dalsi_prijemci: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
        </Pole>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={testSpojeni}
            disabled={testuje || !n.telegram_token || !n.telegram_chat_id}
            className="rounded-lg border border-accent2 px-4 py-2 text-sm text-accent2 transition hover:bg-accent2/10 disabled:opacity-40"
          >
            {testuje ? "Testuji..." : "Test spojení"}
          </button>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={n.aktivni} onChange={(e) => setN({ ...n, aktivni: e.target.checked })} />
            Bot aktivní (hledat a posílat)
          </label>
        </div>
      </Sekce>

      <Sekce titulek="Filtry aut">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Značky <span className="text-zinc-600">({vybraneZname.size} vybráno)</span>
          </p>
          <input
            placeholder="hledat značku..."
            value={hledatZnacku}
            onChange={(e) => setHledatZnacku(e.target.value)}
            className="w-44 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs outline-none ring-accent2 focus:ring-2"
          />
        </div>
        <div className="mb-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border bg-panel2/40 p-2 sm:grid-cols-4">
          {filtrovaneZname.length === 0 && (
            <p className="col-span-full py-4 text-center text-sm text-zinc-500">Žádná značka neodpovídá hledání.</p>
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
        <Pole label="Další značky, co v seznamu nejsou (čárkou, malými písmeny)">
          <input className={input} value={vlastniZnacky} onChange={(e) => ulozitVlastniZnacky(e.target.value)} />
        </Pole>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Pole label="Palivo">
            <select className={input} value={n.filtry.palivo} onChange={(e) => setFiltr("palivo", e.target.value)}>
              <option value="vse">vše</option>
              <option value="benzin">benzín</option>
              <option value="diesel">diesel</option>
            </select>
          </Pole>
          <Pole label="Převodovka">
            <select className={input} value={n.filtry.prevodovka} onChange={(e) => setFiltr("prevodovka", e.target.value)}>
              <option value="vse">vše</option>
              <option value="manual">manuál</option>
              <option value="automat">automat</option>
            </select>
          </Pole>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Pole label="Rok od">
            <input type="number" className={input} value={n.filtry.min_rok} onChange={(e) => setFiltr("min_rok", Number(e.target.value))} />
          </Pole>
          <Pole label="Max nájezd diesel (km)">
            <input type="number" className={input} value={n.filtry.max_najezd_nafta} onChange={(e) => setFiltr("max_najezd_nafta", Number(e.target.value))} />
          </Pole>
          <Pole label="Max nájezd benzín (km)">
            <input type="number" className={input} value={n.filtry.max_najezd_benzin} onChange={(e) => setFiltr("max_najezd_benzin", Number(e.target.value))} />
          </Pole>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Pole label="Cena PL od (PLN)">
            <input type="number" className={input} value={n.filtry.min_cena_pln} onChange={(e) => setFiltr("min_cena_pln", Number(e.target.value))} />
          </Pole>
          <Pole label="Cena PL do (PLN)">
            <input type="number" className={input} value={n.filtry.max_cena_pln} onChange={(e) => setFiltr("max_cena_pln", Number(e.target.value))} />
          </Pole>
        </div>

        <p className="mb-2 mt-6 text-xs text-zinc-400">
          Oblasti v Polsku (prázdné = celé Polsko) – klikni do mapy, vznikne nová oblast
        </p>
        <MapaOkruhy oblasti={n.filtry.oblasti} onKlik={pridatOblastZMapy} />
        <div className="space-y-3">
          {n.filtry.oblasti.map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_100px_auto] items-end gap-2 rounded-lg border border-border bg-panel2 p-3">
              <Pole label="Název">
                <input className={input} value={o.nazev} onChange={(e) => upravitOblast(i, "nazev", e.target.value)} />
              </Pole>
              <Pole label="Slug města">
                <input className={input} value={o.mesto_slug} onChange={(e) => upravitOblast(i, "mesto_slug", e.target.value)} />
              </Pole>
              <Pole label="Okruh (km)">
                <input type="number" className={input} value={o.okruh_km} onChange={(e) => upravitOblast(i, "okruh_km", Number(e.target.value))} />
              </Pole>
              <button type="button" onClick={() => odebratOblast(i)} className="h-fit rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                Smazat
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={pridatOblast} className="mt-3 rounded-lg border border-accent2 px-4 py-2 text-sm text-accent2 hover:bg-accent2/10">
          + Přidat oblast
        </button>
      </Sekce>

      <Sekce titulek="Ziskovost">
        <div className="grid gap-4 sm:grid-cols-3">
          <Pole label="Minimální zisk (Kč)">
            <input type="number" className={input} value={n.min_zisk_kc} onChange={(e) => setN({ ...n, min_zisk_kc: Number(e.target.value) })} />
          </Pole>
          <Pole label="Náklady dovoz (Kč)">
            <input type="number" className={input} value={n.naklady_dovoz_kc} onChange={(e) => setN({ ...n, naklady_dovoz_kc: Number(e.target.value) })} />
          </Pole>
          <Pole label="Min. srovnatelných inzerátů">
            <input type="number" className={input} value={n.min_srovnani} onChange={(e) => setN({ ...n, min_srovnani: Number(e.target.value) })} />
          </Pole>
        </div>
      </Sekce>

      <div className="sticky bottom-4 mt-8 flex items-center gap-4 rounded-xl border border-border bg-panel/95 p-4 backdrop-blur">
        <button
          onClick={ulozit}
          disabled={uklada}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
        >
          {uklada ? "Ukládám..." : "Uložit nastavení"}
        </button>
        {zprava && (
          <p className={`text-sm ${zprava.startsWith("Chyba") ? "text-red-400" : "text-emerald-400"}`}>{zprava}</p>
        )}
      </div>
    </main>
  );
}

