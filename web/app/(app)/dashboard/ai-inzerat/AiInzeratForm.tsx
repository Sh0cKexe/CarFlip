"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sekce, Pole, input, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";
import { AI_INZERAT_LIMIT } from "@/lib/aiLimit";

export type Inzerat = { id: string; nazev: string; vysledek: string; vytvoreno: string };

export default function AiInzeratForm({
  trh, vyuzitoVychozi, historie: historieVychozi,
}: { trh: Trh; vyuzitoVychozi: number; historie: Inzerat[] }) {
  const t = T(trh);
  const [nazev, setNazev] = useState("");
  const [motor, setMotor] = useState("");
  const [rok, setRok] = useState("");
  const [najezd, setNajezd] = useState("");
  const [palivo, setPalivo] = useState("");
  const [prevodovka, setPrevodovka] = useState("");
  const [vykon, setVykon] = useState("");
  const [spotreba, setSpotreba] = useState("");
  const [vin, setVin] = useState("");
  const [poznamky, setPoznamky] = useState("");
  const [bezi, setBezi] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);
  const [vystup, setVystup] = useState("");
  const [zkopirovano, setZkopirovano] = useState(false);
  const [vyuzito, setVyuzito] = useState(vyuzitoVychozi);
  const [historie, setHistorie] = useState<Inzerat[]>(historieVychozi);
  const [rozbaleno, setRozbaleno] = useState<Set<string>>(() => new Set());
  const limitDosazen = vyuzito >= AI_INZERAT_LIMIT;

  function prepnoutRozbaleni(id: string) {
    setRozbaleno((aktualni) => {
      const kopie = new Set(aktualni);
      if (kopie.has(id)) kopie.delete(id);
      else kopie.add(id);
      return kopie;
    });
  }

  async function generovat() {
    setBezi(true);
    setChyba(null);
    setZkopirovano(false);
    try {
      const r = await fetch("/api/ai-inzerat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nazev, motor, rok, najezd, palivo, prevodovka, vykon, spotreba, vin, poznamky, jazyk: trh,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setChyba(j.error || t.neznama);
        return;
      }
      setVystup(j.text);
      if (typeof j.vyuzito === "number") setVyuzito(j.vyuzito);
      if (j.radek) {
        setHistorie([j.radek as Inzerat, ...historie]);
        setRozbaleno((aktualni) => new Set(aktualni).add(j.radek.id));
      }
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
      <h1 className="mb-4 text-xl font-semibold text-zinc-100">{t.aiInzeratNadpis}</h1>

      <Sekce titulek={t.aiInzeratNadpis}>
        <p className="mb-3 text-sm text-zinc-300">
          {vyuzito}/{AI_INZERAT_LIMIT} {t.aiInzeratVyuzitoZLimitu} · {t.aiInzeratNepovinne}
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Pole label={t.nazevModel}>
            <input className={input} value={nazev} onChange={(e) => setNazev(e.target.value)} placeholder="Škoda Octavia II" />
          </Pole>
          <Pole label={t.motor}>
            <input className={input} value={motor} onChange={(e) => setMotor(e.target.value)} placeholder="2.0 TDI" />
          </Pole>
          <Pole label={t.rokVyroby}>
            <input type="number" className={input} value={rok} onChange={(e) => setRok(e.target.value)} placeholder="2007" />
          </Pole>
          <Pole label={t.najezd}>
            <input type="number" className={input} value={najezd} onChange={(e) => setNajezd(e.target.value)} placeholder="km" />
          </Pole>
          <Pole label={t.vykonKw}>
            <input type="number" className={input} value={vykon} onChange={(e) => setVykon(e.target.value)} placeholder="kW" />
          </Pole>
          <Pole label={t.palivo}>
            <select className={input} value={palivo} onChange={(e) => setPalivo(e.target.value)}>
              <option value="">{t.vse}</option>
              <option value={t.benzin}>{t.benzin}</option>
              <option value={t.diesel}>{t.diesel}</option>
              <option value={t.palivoBenzinLpg}>{t.palivoBenzinLpg}</option>
              <option value={t.palivoBenzinCng}>{t.palivoBenzinCng}</option>
              <option value={t.palivoHybrid}>{t.palivoHybrid}</option>
              <option value={t.palivoPluginHybrid}>{t.palivoPluginHybrid}</option>
              <option value={t.palivoElektrina}>{t.palivoElektrina}</option>
            </select>
          </Pole>
          <Pole label={t.prevodovka}>
            <select className={input} value={prevodovka} onChange={(e) => setPrevodovka(e.target.value)}>
              <option value="">{t.vse}</option>
              <option value={t.manual}>{t.manual}</option>
              <option value={t.automat}>{t.automat}</option>
            </select>
          </Pole>
          <Pole label={t.spotrebaKombinovana}>
            <input className={input} value={spotreba} onChange={(e) => setSpotreba(e.target.value)} placeholder="l/100km" />
          </Pole>
          <Pole label={t.vinCislo}>
            <input className={input} value={vin} onChange={(e) => setVin(e.target.value)} placeholder="TMBJJ7NE5N1234567" />
          </Pole>
        </div>
        <div className="mt-3">
          <Pole label={t.aiInzeratPoznamky}>
            <textarea className={`${input} min-h-20`} value={poznamky} onChange={(e) => setPoznamky(e.target.value)} />
          </Pole>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={generovat} disabled={bezi || limitDosazen} className={`mt-3 ${btnGhost}`}>
            {bezi ? t.generuji : t.generujInzerat}
          </button>
          {bezi && (
            <span className="mt-3 flex items-center gap-2 text-sm text-accent">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              {t.aiInzeratProbiha}
            </span>
          )}
        </div>
        {limitDosazen && <p className="mt-2 text-sm text-amber-400">{t.aiInzeratLimitDosazen}</p>}
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

      <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
        {t.aiInzeratDisclaimer}
      </div>

      <Sekce titulek={t.aiHistorie}>
        {historie.length === 0 && <p className="text-sm text-zinc-500">{t.zadneRozbory}</p>}
        <div className="space-y-3">
          {historie.map((h, i) => {
            const otevreno = rozbaleno.has(h.id);
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-lg border border-border bg-panel2 p-4 transition hover:border-zinc-600"
              >
                <button
                  type="button"
                  onClick={() => prepnoutRozbaleni(h.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <p className="truncate text-sm font-medium text-zinc-100">{h.nazev}</p>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-zinc-500">{new Date(h.vytvoreno).toLocaleString("cs-CZ")}</span>
                    <span className="text-zinc-500">{otevreno ? "▾" : "▸"}</span>
                  </div>
                </button>
                {otevreno && <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{h.vysledek}</p>}
              </motion.div>
            );
          })}
        </div>
      </Sekce>
    </main>
  );
}
