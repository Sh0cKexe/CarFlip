"use client";

import { useState } from "react";
import { Sekce, Pole, input, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

export default function AiInzeratForm({ trh }: { trh: Trh }) {
  const t = T(trh);
  const [nazev, setNazev] = useState("");
  const [rok, setRok] = useState("");
  const [najezd, setNajezd] = useState("");
  const [palivo, setPalivo] = useState("");
  const [prevodovka, setPrevodovka] = useState("");
  const [cena, setCena] = useState("");
  const [poznamky, setPoznamky] = useState("");
  const [bezi, setBezi] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);
  const [vystup, setVystup] = useState("");
  const [zkopirovano, setZkopirovano] = useState(false);

  async function generovat() {
    setBezi(true);
    setChyba(null);
    setZkopirovano(false);
    try {
      const r = await fetch("/api/ai-inzerat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nazev, rok, najezd, palivo, prevodovka, cena,
          mena: t.mena, poznamky, jazyk: trh,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setChyba(j.error || t.neznama);
        return;
      }
      setVystup(j.text);
    } catch (e: any) {
      setChyba(t.chybaSite + e.message);
    } finally {
      setBezi(false);
    }
  }

  async function zkopirovatText() {
    await navigator.clipboard.writeText(vystup);
    setZkopirovano(true);
    setTimeout(() => setZkopirovano(false), 2000);
  }

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.aiInzeratNadpis}</h1>

      <Sekce titulek={t.aiInzeratNadpis}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Pole label={t.nazevModel}>
            <input className={input} value={nazev} onChange={(e) => setNazev(e.target.value)} placeholder="Škoda Octavia 2.0 TDI" />
          </Pole>
          <Pole label={t.rokVyroby}>
            <input type="number" className={input} value={rok} onChange={(e) => setRok(e.target.value)} />
          </Pole>
          <Pole label={t.najezd}>
            <input type="number" className={input} value={najezd} onChange={(e) => setNajezd(e.target.value)} placeholder="km" />
          </Pole>
          <Pole label={t.palivo}>
            <select className={input} value={palivo} onChange={(e) => setPalivo(e.target.value)}>
              <option value="">{t.vse}</option>
              <option value={t.benzin}>{t.benzin}</option>
              <option value={t.diesel}>{t.diesel}</option>
            </select>
          </Pole>
          <Pole label={t.prevodovka}>
            <select className={input} value={prevodovka} onChange={(e) => setPrevodovka(e.target.value)}>
              <option value="">{t.vse}</option>
              <option value={t.manual}>{t.manual}</option>
              <option value={t.automat}>{t.automat}</option>
            </select>
          </Pole>
          <Pole label={`${t.cena} (${t.mena})`}>
            <input type="number" className={input} value={cena} onChange={(e) => setCena(e.target.value)} />
          </Pole>
        </div>
        <div className="mt-4">
          <Pole label={t.aiInzeratPoznamky}>
            <textarea className={`${input} min-h-24`} value={poznamky} onChange={(e) => setPoznamky(e.target.value)} />
          </Pole>
        </div>
        <button type="button" onClick={generovat} disabled={bezi || !nazev} className={`mt-3 ${btnGhost}`}>
          {bezi ? t.generuji : t.generujInzerat}
        </button>
        {chyba && <p className="mt-2 text-sm text-red-400">{chyba}</p>}
      </Sekce>

      {vystup && (
        <Sekce titulek={t.vystupInzeratu}>
          <p className="whitespace-pre-wrap text-sm text-zinc-200">{vystup}</p>
          <button type="button" onClick={zkopirovatText} className={`mt-4 ${btnGhost}`}>
            {zkopirovano ? t.zkopirovano : t.zkopirovat}
          </button>
        </Sekce>
      )}
    </main>
  );
}
