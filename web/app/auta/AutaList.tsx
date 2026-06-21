"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/app/components/Sidebar";
import { T, type Trh } from "@/lib/i18n";

export type Auto = {
  id: string;
  titulek: string;
  otomoto_url: string;
  stav: string;
  cena_koupeno_kc: number | null;
  cena_prodano_kc: number | null;
  poznamky: string;
  fotky: string[];
};

const STAV_BARVA: Record<string, string> = {
  koupeno: "bg-accent2/15 text-accent2",
  inzerce: "bg-amber-500/15 text-amber-400",
  prodano: "bg-accent/15 text-accent",
};

export default function AutaList({
  email, userId, auta, nakladySuma, trh,
}: { email: string; userId: string; auta: Auto[]; nakladySuma: Record<string, number>; trh: Trh }) {
  const router = useRouter();
  const supabase = createClient();
  const [vytvarim, setVytvarim] = useState(false);
  const t = T(trh);
  const STAV_TEXT: Record<string, string> = { koupeno: t.koupeno, inzerce: t.vInzerci, prodano: t.prodano };

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

  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} trh={trh} userId={userId} />
      <main className="flex-1 px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-100">{t.mojeAuta}</h1>
          <button
            onClick={pridatAuto}
            disabled={vytvarim}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {vytvarim ? t.vytvarim : t.pridatAuto}
          </button>
        </div>

        {auta.length === 0 && (
          <p className="rounded-2xl border border-border bg-panel p-8 text-center text-sm text-zinc-500">
            {t.zadneAuto}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {auta.map((a) => {
            const naklady = nakladySuma[a.id] ?? 0;
            const zisk =
              a.stav === "prodano" && a.cena_koupeno_kc != null && a.cena_prodano_kc != null
                ? a.cena_prodano_kc - a.cena_koupeno_kc - naklady
                : null;
            return (
              <a
                key={a.id}
                href={`/auta/${a.id}`}
                className="rounded-2xl border border-border bg-panel p-5 transition hover:border-zinc-500"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="truncate font-medium text-zinc-100">{a.titulek || t.bezNazvu}</h2>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STAV_BARVA[a.stav] ?? "bg-zinc-700/40 text-zinc-400"}`}>
                    {STAV_TEXT[a.stav] ?? a.stav}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-zinc-400">
                  {a.cena_koupeno_kc != null && <p>{t.koupenoZa} {a.cena_koupeno_kc.toLocaleString("cs-CZ")} {t.mena}</p>}
                  {naklady > 0 && <p>{t.naklady}: {naklady.toLocaleString("cs-CZ")} {t.mena}</p>}
                  {zisk != null && (
                    <p className={zisk >= 0 ? "font-medium text-accent" : "font-medium text-red-400"}>
                      {t.zisk}: {zisk.toLocaleString("cs-CZ")} {t.mena}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
