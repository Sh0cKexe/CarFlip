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
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ");
}

function kc(n: number, mena: string): string {
  return `${n.toLocaleString("cs-CZ")} ${mena}`;
}

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

  const vazanyKapital = [...koupena, ...vInzerci].reduce(
    (s, a) => s + (a.cena_koupeno_kc ?? 0) + (nakladySuma[a.id] ?? 0),
    0
  );
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
          />
        )}
        {prodana.length > 0 && (
          <SekceAut
            ikona="✅"
            nazev={t.prodano}
            auta={prodana}
            nakladySuma={nakladySuma}
            t={t}
            prodano
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
  ikona, nazev, auta, nakladySuma, t, subtotal, prodano = false,
}: {
  ikona: string;
  nazev: string;
  auta: Auto[];
  nakladySuma: Record<string, number>;
  t: ReturnType<typeof T>;
  subtotal?: { label: string; hodnota: string; tone: "blue" | "green" | "red" };
  prodano?: boolean;
}) {
  const router = useRouter();
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-zinc-500">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Auto</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">{prodano ? t.datumProdano : t.datumKoupeno}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.porizeni}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.naklady}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.celkemVAute}</th>
              {prodano && <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.prodanoZa}</th>}
              {prodano && <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.zisk}</th>}
            </tr>
          </thead>
          <tbody>
            {auta.map((a, i) => {
              const naklady = nakladySuma[a.id] ?? 0;
              const celkemVAute = (a.cena_koupeno_kc ?? 0) + naklady;
              const zisk =
                prodano && a.cena_koupeno_kc != null && a.cena_prodano_kc != null
                  ? a.cena_prodano_kc - a.cena_koupeno_kc - naklady
                  : null;
              const datum = prodano ? a.datum_prodano : a.datum_koupeno;
              return (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => router.push(`/auta/${a.id}`)}
                  className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="max-w-[180px] truncate px-4 py-3 font-medium text-zinc-100">{a.titulek || t.bezNazvu}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{formatDatum(datum)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-300">
                    {a.cena_koupeno_kc != null ? kc(a.cena_koupeno_kc, t.mena) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-300">
                    {naklady > 0 ? kc(naklady, t.mena) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-medium text-zinc-100">
                    {kc(celkemVAute, t.mena)}
                  </td>
                  {prodano && (
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-300">
                      {a.cena_prodano_kc != null ? kc(a.cena_prodano_kc, t.mena) : "—"}
                    </td>
                  )}
                  {prodano && (
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold ${
                        zisk == null ? "text-zinc-500" : zisk >= 0 ? "text-accent" : "text-red-400"
                      }`}
                    >
                      {zisk != null ? kc(zisk, t.mena) : "—"}
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
