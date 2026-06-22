"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Sekce, Pole, input, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

export type Rozbor = { id: string; url: string; vysledek: string; vytvoreno: string };

export default function AiRozborForm({
  userId, trh, historie: historieVychozi,
}: { userId: string; trh: Trh; historie: Rozbor[] }) {
  const supabase = createClient();
  const t = T(trh);
  const [url, setUrl] = useState("");
  const [bezi, setBezi] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);
  const [historie, setHistorie] = useState<Rozbor[]>(historieVychozi);

  async function spustit() {
    setBezi(true);
    setChyba(null);
    try {
      const r = await fetch("/api/ai-rozbor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const j = await r.json();
      if (!r.ok) {
        setChyba(j.error || t.neznama);
        return;
      }
      const { data } = await supabase
        .from("ai_rozbory")
        .insert({ user_id: userId, url, vysledek: j.text })
        .select("*")
        .single();
      if (data) setHistorie([data as Rozbor, ...historie]);
      setUrl("");
    } catch (e: any) {
      setChyba(t.chybaSite + e.message);
    } finally {
      setBezi(false);
    }
  }

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.aiRozborNadpis}</h1>

        <Sekce titulek={t.aiRozborNadpis}>
          <Pole label={t.vlozLink}>
            <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.otomoto.pl/..." />
          </Pole>
          <button type="button" onClick={spustit} disabled={bezi || !url} className={`mt-3 ${btnGhost}`}>
            {bezi ? t.analyzuji : t.spustitRozbor}
          </button>
          {chyba && <p className="mt-2 text-sm text-red-400">{chyba}</p>}
        </Sekce>

        <Sekce titulek={t.aiHistorie}>
          {historie.length === 0 && <p className="text-sm text-zinc-500">{t.zadneRozbory}</p>}
          <div className="space-y-3">
            {historie.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-lg border border-border bg-panel2 p-4 transition hover:border-zinc-600"
              >
                <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                  <a href={h.url} target="_blank" rel="noreferrer" className="truncate text-accent2 hover:underline">{h.url}</a>
                  <span className="ml-3 shrink-0">{new Date(h.vytvoreno).toLocaleString("cs-CZ")}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-zinc-200">{h.vysledek}</p>
              </motion.div>
            ))}
          </div>
      </Sekce>
    </main>
  );
}
