"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sekce } from "@/app/components/FormUI";
import CountUp from "@/app/components/CountUp";
import { T, type Trh } from "@/lib/i18n";
import { AI_ROZBOR_LIMIT, AI_INZERAT_LIMIT, AI_MECHANIK_LIMIT } from "@/lib/aiLimit";

type Ukol = { id: string; text: string; autoTitulek: string; autoId: string };

export default function DashboardOverview({
  trh, pocetAutCelkem, pocetKoupeno, pocetVInzerci, pocetProdano, celkovyZisk,
  prumernyZiskAuto, prumernaDobaDrzeniDni, ukoly,
  aiRozboru, aiInzeratu, aiMechanikChatu,
}: {
  trh: Trh;
  pocetAutCelkem: number;
  pocetKoupeno: number;
  pocetVInzerci: number;
  pocetProdano: number;
  celkovyZisk: number;
  prumernyZiskAuto: number | null;
  prumernaDobaDrzeniDni: number | null;
  ukoly: Ukol[];
  aiRozboru: number;
  aiInzeratu: number;
  aiMechanikChatu: number;
}) {
  const t = T(trh);

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 text-xl font-semibold text-zinc-100"
        >
          {t.prehled}
        </motion.h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Sekce titulek={t.pocetAutCelkem}>
              <p className="text-3xl font-semibold text-zinc-100">
                <CountUp value={pocetAutCelkem} formatuj={(n) => `${n}`} />
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-panel2/80 px-3 py-1 text-sm font-medium text-zinc-200">{t.koupeno}: {pocetKoupeno}</span>
                <span className="rounded-full bg-panel2/80 px-3 py-1 text-sm font-medium text-zinc-200">{t.vInzerci}: {pocetVInzerci}</span>
                <span className="rounded-full bg-panel2/80 px-3 py-1 text-sm font-medium text-zinc-200">{t.prodano}: {pocetProdano}</span>
              </div>
            </Sekce>
            <Sekce titulek={t.celkovyZisk}>
              <p className={`text-3xl font-semibold ${celkovyZisk >= 0 ? "text-gradient" : "text-red-400"}`}>
                <CountUp value={celkovyZisk} formatuj={(n) => `${n.toLocaleString("cs-CZ")} ${t.mena}`} />
              </p>
            </Sekce>
            {prumernyZiskAuto != null && (
              <Sekce titulek={t.prumernyZiskAuto}>
                <p className={`text-3xl font-semibold ${prumernyZiskAuto >= 0 ? "text-gradient" : "text-red-400"}`}>
                  <CountUp value={prumernyZiskAuto} formatuj={(n) => `${n.toLocaleString("cs-CZ")} ${t.mena}`} />
                </p>
              </Sekce>
            )}
            {prumernaDobaDrzeniDni != null && (
              <Sekce titulek={t.prumernaDobaDrzeni}>
                <p className="text-3xl font-semibold text-zinc-100">
                  <CountUp value={prumernaDobaDrzeniDni} formatuj={(n) => `${n} ${t.dniZkratka}`} />
                </p>
              </Sekce>
            )}
          </div>

          <div className="glass flex h-full flex-col rounded-2xl border border-border p-6">
            <h2 className="mb-4 text-base font-semibold text-zinc-100">{t.otevreneUkoly} ({ukoly.length})</h2>
            {ukoly.length === 0 && <p className="text-sm text-zinc-500">{t.zadneUkoly}</p>}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {ukoly.map((u) => (
                <Link
                  key={u.id}
                  href={`/auta/${u.autoId}`}
                  className="block rounded-lg border border-border bg-panel2/40 p-2.5 text-sm transition hover:border-zinc-600"
                >
                  <span className="text-zinc-100">{u.text}</span>
                  {u.autoTitulek && <span className="ml-2 text-zinc-500">— {u.autoTitulek}</span>}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <h2 className="mb-4 mt-8 text-lg font-semibold text-zinc-100">{t.aiLimityNadpis}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Sekce titulek={t.aiRozborNadpis}>
            <p className="text-2xl font-semibold text-zinc-100">{aiRozboru}/{AI_ROZBOR_LIMIT}</p>
          </Sekce>
          <Sekce titulek={t.aiInzeratNadpis}>
            <p className="text-2xl font-semibold text-zinc-100">{aiInzeratu}/{AI_INZERAT_LIMIT}</p>
          </Sekce>
          <Sekce titulek={t.aiMechanikNadpis}>
            <p className="text-2xl font-semibold text-zinc-100">{aiMechanikChatu}/{AI_MECHANIK_LIMIT}</p>
          </Sekce>
        </div>
    </main>
  );
}
