"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { btnPrimary } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

export type Auto = {
  id: string;
  titulek: string;
  otomoto_url: string;
  stav: string;
  cena_koupeno_kc: number | null;
  cena_prodano_kc: number | null;
  datum_koupeno: string | null;
  datum_prodano: string | null;
  poznamky: string;
  fotky: string[];
};

function formatDatum(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("cs-CZ");
}

function kc(n: number, mena: string): string {
  return `${n.toLocaleString("cs-CZ")} ${mena}`;
}

const PRUH_BARVA: Record<string, string> = {
  koupeno: "bg-accent2",
  inzerce: "bg-amber-400",
  prodano: "bg-accent",
};

export default function AutaList({
  userId, auta, nakladySuma, trh,
}: { userId: string; auta: Auto[]; nakladySuma: Record<string, number>; trh: Trh }) {
  const router = useRouter();
  const supabase = createClient();
  const [vytvarim, setVytvarim] = useState(false);
  const t = T(trh);

  async function pridatAuto() {
    setVytvarim(true);
    const { data, error } = await supabase
      .from("auta")
      .insert({ user_id: userId, titulek: "Nové auto" })
      .select("id")
      .single();
    setVytvarim(false);
    if (!error && data) router.push(`/auta/${data.id}`);
  }

  const koupena = auta.filter((a) => a.stav === "koupeno");
  const vInzerci = auta.filter((a) => a.stav === "inzerce");
  const prodana = auta.filter((a) => a.stav === "prodano");

  const vazanyKapital = [...koupena, ...vInzerci].reduce((s, a) => s + (a.cena_koupeno_kc ?? 0), 0);
  const celkovyZisk = prodana.reduce((s, a) => {
    if (a.cena_koupeno_kc == null || a.cena_prodano_kc == null) return s;
    return s + (a.cena_prodano_kc - a.cena_koupeno_kc - (nakladySuma[a.id] ?? 0));
  }, 0);

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">{t.mojeAuta}</h1>
        <button onClick={pridatAuto} disabled={vytvarim} className={btnPrimary}>
          {vytvarim ? t.vytvarim : t.pridatAuto}
        </button>
      </div>

      {auta.length === 0 && (
        <p className="glass rounded-2xl border border-border p-8 text-center text-sm text-zinc-500">
          {t.zadneAuto}
        </p>
      )}

      <div className="space-y-6">
        {koupena.length > 0 && (
          <SekceAut
            ikona="🛒"
            nazev={t.koupeno}
            auta={koupena}
            nakladySuma={nakladySuma}
            t={t}
            barva="koupeno"
            subtotal={{ label: t.vazanyKapital, hodnota: kc(vazanyKapital, t.mena), tone: "blue" }}
          />
        )}
        {vInzerci.length > 0 && (
          <SekceAut
            ikona="📢"
            nazev={t.vInzerci}
            auta={vInzerci}
            nakladySuma={nakladySuma}
            t={t}
            barva="inzerce"
          />
        )}
        {prodana.length > 0 && (
          <SekceAut
            ikona="✅"
            nazev={t.prodano}
            auta={prodana}
            nakladySuma={nakladySuma}
            t={t}
            barva="prodano"
            subtotal={{
              label: t.zisk,
              hodnota: kc(celkovyZisk, t.mena),
              tone: celkovyZisk >= 0 ? "green" : "red",
            }}
          />
        )}
      </div>
    </main>
  );
}

function SekceAut({
  ikona, nazev, auta, nakladySuma, t, barva, subtotal,
}: {
  ikona: string;
  nazev: string;
  auta: Auto[];
  nakladySuma: Record<string, number>;
  t: ReturnType<typeof T>;
  barva: string;
  subtotal?: { label: string; hodnota: string; tone: "blue" | "green" | "red" };
}) {
  const toneClass: Record<string, string> = {
    blue: "bg-accent2/15 text-accent2",
    green: "bg-accent/15 text-accent",
    red: "bg-red-500/15 text-red-400",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass overflow-hidden rounded-2xl border border-border shadow-glow"
    >
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{ikona}</span>
          <h2 className="text-sm font-semibold capitalize text-zinc-100">{nazev}</h2>
          <span className="rounded-full bg-zinc-700/40 px-2 py-0.5 text-xs text-zinc-400">{auta.length}</span>
        </div>
        {subtotal && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${toneClass[subtotal.tone]}`}>
            {subtotal.label}: {subtotal.hodnota}
          </span>
        )}
      </div>

      <div className="px-3">
        {auta.map((a, i) => {
          const naklady = nakladySuma[a.id] ?? 0;
          const zisk =
            a.stav === "prodano" && a.cena_koupeno_kc != null && a.cena_prodano_kc != null
              ? a.cena_prodano_kc - a.cena_koupeno_kc - naklady
              : null;
          return (
            <motion.a
              key={a.id}
              href={`/auta/${a.id}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
              className="group flex items-center gap-4 border-b border-border/40 px-3 py-3.5 transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              <span className={`h-8 w-1 shrink-0 rounded-full ${PRUH_BARVA[barva]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100 group-hover:text-white">
                  {a.titulek || t.bezNazvu}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {a.stav === "prodano" && a.datum_prodano
                    ? `${t.datumProdano}: ${formatDatum(a.datum_prodano)}`
                    : a.datum_koupeno
                    ? `${t.datumKoupeno}: ${formatDatum(a.datum_koupeno)}`
                    : ""}
                </p>
              </div>
              <div className="shrink-0 text-right tabular-nums">
                {a.stav === "prodano" ? (
                  <>
                    {zisk != null && (
                      <p className={`text-sm font-semibold ${zisk >= 0 ? "text-accent" : "text-red-400"}`}>
                        {kc(zisk, t.mena)}
                      </p>
                    )}
                    {a.cena_prodano_kc != null && (
                      <p className="text-xs text-zinc-500">{t.prodanoZa} {kc(a.cena_prodano_kc, t.mena)}</p>
                    )}
                  </>
                ) : (
                  <>
                    {a.cena_koupeno_kc != null && (
                      <p className="text-sm font-medium text-zinc-200">{kc(a.cena_koupeno_kc, t.mena)}</p>
                    )}
                    {naklady > 0 && <p className="text-xs text-zinc-500">{t.naklady}: {kc(naklady, t.mena)}</p>}
                  </>
                )}
              </div>
              <span className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-400">→</span>
            </motion.a>
          );
        })}
      </div>
    </motion.section>
  );
}
