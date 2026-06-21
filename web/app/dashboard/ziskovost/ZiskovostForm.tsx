"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/app/components/Sidebar";
import { Sekce, Pole, input } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

type Nastaveni = {
  user_id: string;
  min_zisk_kc: number;
  naklady_dovoz_kc: number;
  min_srovnani: number;
  trh: Trh;
};

export default function ZiskovostForm({ email, nastaveni }: { email: string; nastaveni: Nastaveni | null }) {
  const supabase = createClient();
  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? { user_id: "", min_zisk_kc: 20000, naklady_dovoz_kc: 10000, min_srovnani: 3, trh: "cz" }
  );
  const t = T(n.trh);
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);

  async function ulozit() {
    setUklada(true);
    setZprava(null);
    const { error } = await supabase
      .from("nastaveni")
      .update({
        min_zisk_kc: n.min_zisk_kc,
        naklady_dovoz_kc: n.naklady_dovoz_kc,
        min_srovnani: n.min_srovnani,
      })
      .eq("user_id", n.user_id);
    setUklada(false);
    setZprava(error ? t.chybaUkladani + error.message : t.ulozeno);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} trh={n.trh} />
      <main className="flex-1 px-8 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">{t.ziskovost}</h1>

        <Sekce titulek={t.ziskovost}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Pole label={`${t.minimalniZisk} (${t.mena})`}>
              <input type="number" className={input} value={n.min_zisk_kc} onChange={(e) => setN({ ...n, min_zisk_kc: Number(e.target.value) })} />
            </Pole>
            <Pole label={`${t.nakladyDovoz} (${t.mena})`}>
              <input type="number" className={input} value={n.naklady_dovoz_kc} onChange={(e) => setN({ ...n, naklady_dovoz_kc: Number(e.target.value) })} />
            </Pole>
            <Pole label={t.minSrovnatelnych}>
              <input type="number" className={input} value={n.min_srovnani} onChange={(e) => setN({ ...n, min_srovnani: Number(e.target.value) })} />
            </Pole>
          </div>
        </Sekce>

        <button
          onClick={ulozit}
          disabled={uklada}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {uklada ? t.ukladam : t.ulozitNastaveni}
        </button>
        {zprava && (
          <p className={`mt-3 text-sm ${zprava.startsWith("Chyb") ? "text-red-600" : "text-accent"}`}>{zprava}</p>
        )}
      </main>
    </div>
  );
}
