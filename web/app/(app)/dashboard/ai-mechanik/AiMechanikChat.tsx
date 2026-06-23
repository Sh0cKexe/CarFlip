"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sekce, Pole, input, btnGhost, btnPrimary } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";
import { AI_MECHANIK_LIMIT } from "@/lib/aiLimit";

type Zprava = { role: "user" | "assistant"; obsah: string };
type Auto = { znacka: string; model: string; rok: string; motor: string; vykon: string };
export type MechanikChat = Auto & { id: string; zpravy: Zprava[]; vytvoreno: string; aktualizovano: string };

export default function AiMechanikChat({
  trh, vyuzitoVychozi, historie: historieVychozi,
}: { trh: Trh; vyuzitoVychozi: number; historie: MechanikChat[] }) {
  const t = T(trh);
  const [auto, setAuto] = useState<Auto>({ znacka: "", model: "", rok: "", motor: "", vykon: "" });
  const [chatZacat, setChatZacat] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [zpravy, setZpravy] = useState<Zprava[]>([]);
  const [vstup, setVstup] = useState("");
  const [bezi, setBezi] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);
  const [vyuzito, setVyuzito] = useState(vyuzitoVychozi);
  const [historie, setHistorie] = useState<MechanikChat[]>(historieVychozi);
  const [rozbaleno, setRozbaleno] = useState<Set<string>>(() => new Set());

  const autoVyplneno = auto.znacka && auto.model && auto.rok && auto.motor && auto.vykon;
  const limitDosazen = vyuzito >= AI_MECHANIK_LIMIT;

  function prepnoutRozbaleni(id: string) {
    setRozbaleno((aktualni) => {
      const kopie = new Set(aktualni);
      if (kopie.has(id)) kopie.delete(id);
      else kopie.add(id);
      return kopie;
    });
  }

  function pokracovatVChatu(h: MechanikChat) {
    setAuto({ znacka: h.znacka, model: h.model, rok: h.rok, motor: h.motor, vykon: h.vykon });
    setActiveChatId(h.id);
    setZpravy(h.zpravy);
    setChatZacat(true);
  }

  async function poslat() {
    if (!vstup.trim()) return;
    const novaHistorie: Zprava[] = [...zpravy, { role: "user", obsah: vstup }];
    setZpravy(novaHistorie);
    const odeslano = vstup;
    setVstup("");
    setBezi(true);
    setChyba(null);
    try {
      const r = await fetch("/api/ai-mechanik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeChatId, auto, zprava: odeslano, historie: zpravy, jazyk: trh }),
      });
      const j = await r.json();
      if (!r.ok) {
        setChyba(j.error || t.neznama);
        return;
      }
      const finalniHistorie = [...novaHistorie, { role: "assistant" as const, obsah: j.text }];
      setZpravy(finalniHistorie);
      if (j.chatId && !activeChatId) {
        setActiveChatId(j.chatId);
        if (typeof j.vyuzito === "number") setVyuzito(j.vyuzito);
        const ted = new Date().toISOString();
        setHistorie([{ id: j.chatId, ...auto, zpravy: finalniHistorie, vytvoreno: ted, aktualizovano: ted }, ...historie]);
      } else if (activeChatId) {
        setHistorie(historie.map((h) => (h.id === activeChatId ? { ...h, zpravy: finalniHistorie, aktualizovano: new Date().toISOString() } : h)));
      }
    } catch (e: any) {
      setChyba(t.chybaSite + e.message);
    } finally {
      setBezi(false);
    }
  }

  function novyAuto() {
    setChatZacat(false);
    setActiveChatId(null);
    setZpravy([]);
    setAuto({ znacka: "", model: "", rok: "", motor: "", vykon: "" });
  }

  const historieSekce = (
    <Sekce titulek={t.aiMechanikHistorie}>
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
              <button type="button" onClick={() => prepnoutRozbaleni(h.id)} className="flex w-full items-start justify-between gap-3 text-left">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {h.znacka} {h.model} ({h.rok}, {h.motor}, {h.vykon} kW)
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-zinc-500">{new Date(h.aktualizovano).toLocaleString("cs-CZ")}</span>
                  <span className="text-zinc-500">{otevreno ? "▾" : "▸"}</span>
                </div>
              </button>
              {otevreno && (
                <div className="mt-3 space-y-2">
                  {h.zpravy.map((z, idx) => (
                    <div key={idx} className={`rounded-lg p-3 text-sm ${z.role === "user" ? "bg-panel2/60 text-zinc-100" : "border border-border bg-panel2/40 text-zinc-200"}`}>
                      <p className="mb-1 text-xs font-medium text-zinc-500">{z.role === "user" ? "" : t.mechAsistent}</p>
                      <p className="whitespace-pre-wrap">{z.obsah}</p>
                    </div>
                  ))}
                  <button type="button" onClick={() => pokracovatVChatu(h)} className={`mt-2 ${btnGhost}`}>
                    {t.pokracovatVChatu}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Sekce>
  );

  if (!chatZacat) {
    return (
      <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.aiMechanikNadpis}</h1>
        <Sekce titulek={t.aiMechanikNadpis}>
          <p className="mb-3 text-sm text-zinc-300">
            {vyuzito}/{AI_MECHANIK_LIMIT} {t.aiMechanikVyuzitoZLimitu}
          </p>
          <p className="mb-4 text-sm text-zinc-400">{t.vyplnUdajeAuta}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Pole label={t.mechZnacka}>
              <input className={input} value={auto.znacka} onChange={(e) => setAuto({ ...auto, znacka: e.target.value })} placeholder="Škoda" />
            </Pole>
            <Pole label={t.mechModel}>
              <input className={input} value={auto.model} onChange={(e) => setAuto({ ...auto, model: e.target.value })} placeholder="Octavia 2" />
            </Pole>
            <Pole label={t.rokVyroby}>
              <input type="number" className={input} value={auto.rok} onChange={(e) => setAuto({ ...auto, rok: e.target.value })} />
            </Pole>
            <Pole label={t.mechMotor}>
              <input className={input} value={auto.motor} onChange={(e) => setAuto({ ...auto, motor: e.target.value })} placeholder="1.9 TDI" />
            </Pole>
            <Pole label={t.vykonKw}>
              <input type="number" className={input} value={auto.vykon} onChange={(e) => setAuto({ ...auto, vykon: e.target.value })} placeholder="kW" />
            </Pole>
          </div>
          <button type="button" onClick={() => setChatZacat(true)} disabled={!autoVyplneno || limitDosazen} className={`mt-4 ${btnPrimary}`}>
            {t.zacniChat}
          </button>
          {limitDosazen && <p className="mt-2 text-sm text-amber-400">{t.aiMechanikLimitDosazen}</p>}
        </Sekce>

        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {t.aiMechanikDisclaimer}
        </div>

        {historieSekce}
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">{t.aiMechanikNadpis}</h1>
        <button type="button" onClick={novyAuto} className={btnGhost}>{t.novyAutoDoChatu}</button>
      </div>

      <Sekce titulek={`${auto.znacka} ${auto.model} (${auto.rok}, ${auto.motor}, ${auto.vykon} kW)`}>
        <div className="space-y-3">
          {zpravy.map((z, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${
                z.role === "user" ? "bg-panel2 text-zinc-100" : "border border-border bg-panel2/40 text-zinc-200"
              }`}
            >
              <p className="mb-1 text-xs font-medium text-zinc-500">{z.role === "user" ? "" : t.mechAsistent}</p>
              <p className="whitespace-pre-wrap">{z.obsah}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className={input}
            value={vstup}
            onChange={(e) => setVstup(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !bezi) poslat(); }}
            placeholder={t.napisOtazku}
          />
          <button type="button" onClick={poslat} disabled={bezi || !vstup.trim()} className={btnGhost}>
            {t.odeslat}
          </button>
        </div>
        {bezi && (
          <span className="mt-2 flex items-center gap-2 text-sm text-accent">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            {t.aiMechanikProbiha}
          </span>
        )}
        {chyba && <p className="mt-2 text-sm text-red-400">{chyba}</p>}
      </Sekce>

      <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
        {t.aiMechanikDisclaimer}
      </div>
    </main>
  );
}
