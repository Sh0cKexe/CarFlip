"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Pole, input, btnPrimary, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

function dnesIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export type Auto = {
  id: string;
  titulek: string;
  otomoto_url: string;
  stav: string;
  cena_koupeno_kc: number | null;
  cena_prodano_kc: number | null;
  datum_koupeno: string | null;
  datum_inzerce: string | null;
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
  const [modalOtevren, setModalOtevren] = useState(false);
  const [novyNazev, setNovyNazev] = useState("");
  const [novyDatum, setNovyDatum] = useState(dnesIso());
  const [novaCena, setNovaCena] = useState("");
  const t = T(trh);

  async function vytvoritAuto() {
    if (!novyNazev.trim()) return;
    setVytvarim(true);
    const { data, error } = await supabase
      .from("auta")
      .insert({
        user_id: userId,
        titulek: novyNazev.trim(),
        datum_koupeno: novyDatum,
        cena_koupeno_kc: novaCena ? Number(novaCena) : null,
      })
      .select("id")
      .single();
    setVytvarim(false);
    if (!error && data) router.push(`/auta/${data.id}`);
  }

  const koupena = auta.filter((a) => a.stav === "koupeno");
  const vInzerci = auta.filter((a) => a.stav === "inzerce");
  const prodana = auta.filter((a) => a.stav === "prodano");

  const SEKCE = [
    { ikona: "🛒", nazev: t.koupeno, auta: koupena },
    { ikona: "📢", nazev: t.vInzerci, auta: vInzerci },
    { ikona: "✅", nazev: t.prodano, auta: prodana },
  ];

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">{t.mojeAuta}</h1>
        <button onClick={() => setModalOtevren(true)} className={btnPrimary}>
          {t.pridatAuto}
        </button>
      </div>

      <div className="space-y-6">
        {SEKCE.map(({ ikona, nazev, auta: sekceAuta }) => (
          <SekceAut
            key={nazev}
            ikona={ikona}
            nazev={nazev}
            auta={sekceAuta}
            nakladySuma={nakladySuma}
            t={t}
          />
        ))}
      </div>

      <AnimatePresence>
        {modalOtevren && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setModalOtevren(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md rounded-2xl border border-border p-6 shadow-glow-lg"
            >
              <h2 className="mb-4 text-base font-semibold text-zinc-100">{t.zalozitProjekt}</h2>
              <div className="space-y-4">
                <Pole label={t.novyAutoNazev}>
                  <input
                    autoFocus className={input} value={novyNazev}
                    onChange={(e) => setNovyNazev(e.target.value)}
                  />
                </Pole>
                <Pole label={t.datumKoupeno}>
                  <input
                    type="date" className={input} value={novyDatum}
                    onChange={(e) => setNovyDatum(e.target.value)}
                  />
                </Pole>
                <Pole label={`${t.cenaKoupeno} (${t.mena})`}>
                  <input
                    type="number" className={input} value={novaCena}
                    onChange={(e) => setNovaCena(e.target.value)}
                  />
                </Pole>

              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setModalOtevren(false)} className={btnGhost}>{t.zrusit}</button>
                <button onClick={vytvoritAuto} disabled={vytvarim || !novyNazev.trim()} className={btnPrimary}>
                  {vytvarim ? t.vytvarim : t.vytvoritAuto}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function SekceAut({
  ikona, nazev, auta, nakladySuma, t,
}: {
  ikona: string;
  nazev: string;
  auta: Auto[];
  nakladySuma: Record<string, number>;
  t: ReturnType<typeof T>;
}) {
  const router = useRouter();

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass overflow-hidden rounded-2xl border border-border shadow-glow"
    >
      <div className="flex items-center gap-2.5 border-b border-border/60 px-6 py-4">
        <span className="text-base">{ikona}</span>
        <h2 className="text-sm font-semibold capitalize text-zinc-100">{nazev}</h2>
        <span className="rounded-full bg-zinc-700/40 px-2 py-0.5 text-xs text-zinc-400">{auta.length}</span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <p className="px-4 pb-1 pt-2 text-[10px] text-zinc-600 sm:hidden">← přejeď pro více sloupců →</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-zinc-500">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Auto</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">{t.datumKoupeno}</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">{t.datumInzerce}</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">{t.datumProdano}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.porizeni}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.naklady}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.celkemVAute}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.prodanoZa}</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">{t.zisk}</th>
            </tr>
          </thead>
          <tbody>
            {auta.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-5 text-center text-sm text-zinc-600">{t.zadneAuto}</td>
              </tr>
            ) : (
              auta.map((a, i) => {
                const naklady = nakladySuma[a.id] ?? 0;
                const celkemVAute = (a.cena_koupeno_kc ?? 0) + naklady;
                const zisk =
                  a.cena_koupeno_kc != null && a.cena_prodano_kc != null
                    ? a.cena_prodano_kc - a.cena_koupeno_kc - naklady
                    : null;
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
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{formatDatum(a.datum_koupeno)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{formatDatum(a.datum_inzerce)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{formatDatum(a.datum_prodano)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-300">
                      {a.cena_koupeno_kc != null ? kc(a.cena_koupeno_kc, t.mena) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-300">
                      {naklady > 0 ? kc(naklady, t.mena) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-medium text-zinc-100">
                      {kc(celkemVAute, t.mena)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-300">
                      {a.cena_prodano_kc != null ? kc(a.cena_prodano_kc, t.mena) : "—"}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold ${
                        zisk == null ? "text-zinc-500" : zisk >= 0 ? "text-accent" : "text-red-400"
                      }`}
                    >
                      {zisk != null ? kc(zisk, t.mena) : "—"}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
