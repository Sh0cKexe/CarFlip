"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sekce, Pole, input, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";
import { AI_ROZBOR_LIMIT } from "@/lib/aiLimit";

export type Rozbor = { id: string; url: string; vysledek: string; vytvoreno: string; titulek?: string };

export default function AiRozborForm({
  trh, historie: historieVychozi, vyuzitoVychozi,
}: { trh: Trh; historie: Rozbor[]; vyuzitoVychozi: number }) {
  const t = T(trh);
  const [url, setUrl] = useState("");
  const [bezi, setBezi] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);
  const [historie, setHistorie] = useState<Rozbor[]>(historieVychozi);
  const [vyuzito, setVyuzito] = useState(vyuzitoVychozi);
  const [rozbaleno, setRozbaleno] = useState<Set<string>>(() => new Set());
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  function prepnoutRozbaleni(id: string) {
    setRozbaleno((aktualni) => {
      const kopie = new Set(aktualni);
      if (kopie.has(id)) kopie.delete(id);
      else kopie.add(id);
      return kopie;
    });
  }

  async function spustit() {
    setBezi(true);
    setChyba(null);
    setStreamingText("");
    setIsSearching(false);
    try {
      const r = await fetch("/api/ai-rozbor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!r.ok) {
        const j = await r.json();
        setChyba(j.error || t.neznama);
        setStreamingText(null);
        return;
      }

      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let currentText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine.slice(6));
            if (data.type === "text") {
              setIsSearching(false);
              currentText += data.delta;
              setStreamingText(currentText);
            } else if (data.type === "searching") {
              setIsSearching(true);
            } else if (data.type === "done") {
              setIsSearching(false);
              if (data.radek) {
                setHistorie((prev) => [data.radek as Rozbor, ...prev]);
                setRozbaleno((prev) => new Set(prev).add(data.radek.id));
              }
              if (typeof data.vyuzito === "number") setVyuzito(data.vyuzito);
              setUrl("");
              setStreamingText(null);
            } else if (data.type === "error") {
              setChyba(data.error);
              setStreamingText(null);
            }
          } catch {
            // malformed SSE chunk, skip
          }
        }
      }
    } catch (e: any) {
      setChyba(t.chybaSite + e.message);
      setStreamingText(null);
    } finally {
      setBezi(false);
      setIsSearching(false);
    }
  }

  const limitDosazen = vyuzito >= AI_ROZBOR_LIMIT;

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.aiRozborNadpis}</h1>

        <Sekce titulek={t.aiRozborNadpis}>
          <p className="mb-3 text-xs text-zinc-500">
            {vyuzito}/{AI_ROZBOR_LIMIT} {t.aiVyuzitoZLimitu}
          </p>
          <Pole label={t.vlozLink}>
            <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.otomoto.pl/... nebo Bazoš/AutoScout24/Willhaben" disabled={limitDosazen} />
          </Pole>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={spustit} disabled={bezi || !url || limitDosazen} className={`mt-3 ${btnGhost}`}>
              {bezi ? t.analyzuji : t.spustitRozbor}
            </button>
          </div>
          {limitDosazen && <p className="mt-2 text-sm text-amber-400">{t.aiLimitDosazen}</p>}
          {chyba && <p className="mt-2 text-sm text-red-400">{chyba}</p>}
        </Sekce>

        {streamingText !== null && (
          <div className="mb-6 rounded-lg border border-border bg-panel2 p-4">
            {isSearching && (
              <p className="mb-3 flex items-center gap-2 text-sm text-accent">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                🔍 Vyhledávám informace na webu...
              </p>
            )}
            {streamingText ? (
              <p className="whitespace-pre-wrap text-sm text-zinc-200">{streamingText}</p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-zinc-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-400" />
                {t.aiRozborProbiha}
              </p>
            )}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {t.aiDisclaimer}
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{h.titulek || h.url}</p>
                      <div className="mt-0.5 flex items-center justify-between text-xs text-zinc-500">
                        <a
                          href={h.url} target="_blank" rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="truncate text-accent2 hover:underline"
                        >
                          {h.url}
                        </a>
                        <span className="ml-3 shrink-0">{new Date(h.vytvoreno).toLocaleString("cs-CZ")}</span>
                      </div>
                    </div>
                    <span className="mt-0.5 shrink-0 text-zinc-500">{otevreno ? "▾" : "▸"}</span>
                  </button>
                  {otevreno && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{h.vysledek}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
      </Sekce>
    </main>
  );
}
