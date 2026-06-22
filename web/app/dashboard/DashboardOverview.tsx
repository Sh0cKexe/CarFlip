"use client";

import { motion } from "framer-motion";
import Sidebar from "@/app/components/Sidebar";
import { Sekce } from "@/app/components/FormUI";
import CountUp from "@/app/components/CountUp";
import { T, type Trh } from "@/lib/i18n";

export default function DashboardOverview({
  email, userId, trh, pocetAutCelkem, pocetKoupeno, pocetInzerce, pocetProdano, celkovyZisk,
}: {
  email: string;
  userId: string;
  trh: Trh;
  pocetAutCelkem: number;
  pocetKoupeno: number;
  pocetInzerce: number;
  pocetProdano: number;
  celkovyZisk: number;
}) {
  const t = T(trh);

  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} trh={trh} userId={userId} />
      <main className="flex-1 px-8 py-8">
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
              <span>{t.vInzerci}: {pocetInzerce}</span>
              <span>{t.prodano}: {pocetProdano}</span>
            </div>
          </Sekce>
        </div>
      </main>
    </div>
  );
}
