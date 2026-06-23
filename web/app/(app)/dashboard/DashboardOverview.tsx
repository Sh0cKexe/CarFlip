"use client";

import { motion } from "framer-motion";
import { Sekce } from "@/app/components/FormUI";
import CountUp from "@/app/components/CountUp";
import { T, type Trh } from "@/lib/i18n";
import { AI_ROZBOR_LIMIT, AI_INZERAT_LIMIT, AI_MECHANIK_LIMIT } from "@/lib/aiLimit";

export default function DashboardOverview({
  trh, pocetAutCelkem, pocetKoupeno, pocetVInzerci, pocetProdano, celkovyZisk,
  celkoveNaklady, prumernyZiskAuto, prumernaDobaDrzeniDni, otevreneUkoly,
  aiRozboru, aiInzeratu, aiMechanikChatu,
}: {
  trh: Trh;
  pocetAutCelkem: number;
  pocetKoupeno: number;
  pocetVInzerci: number;
  pocetProdano: number;
  celkovyZisk: number;
  celkoveNaklady: number;
  prumernyZiskAuto: number | null;
  prumernaDobaDrzeniDni: number | null;
  otevreneUkoly: number;
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
          <Sekce titulek={t.celkovyZisk}>
            <p className={`text-3xl font-semibold ${celkovyZisk >= 0 ? "text-gradient" : "text-red-400"}`}>
              <CountUp value={celkovyZisk} formatuj={(n) => `${n.toLocaleString("cs-CZ")} ${t.mena}`} />
            </p>
          </Sekce>
          <Sekce titulek={t.pocetAutCelkem}>
            <p className="text-3xl font-semibold text-zinc-100">
              <CountUp value={pocetAutCelkem} formatuj={(n) => `${n}`} />
            </p>
            <div className="mt-3 flex gap-4 text-sm text-zinc-400">
              <span>{t.koupeno}: {pocetKoupeno}</span>
              <span>{t.vInzerci}: {pocetVInzerci}</span>
              <span>{t.prodano}: {pocetProdano}</span>
            </div>
          </Sekce>
          <Sekce titulek={t.celkoveNaklady}>
            <p className="text-3xl font-semibold text-zinc-100">
              <CountUp value={celkoveNaklady} formatuj={(n) => `${n.toLocaleString("cs-CZ")} ${t.mena}`} />
            </p>
          </Sekce>
          <Sekce titulek={t.otevreneUkoly}>
            <p className="text-3xl font-semibold text-zinc-100">
              <CountUp value={otevreneUkoly} formatuj={(n) => `${n}`} />
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
