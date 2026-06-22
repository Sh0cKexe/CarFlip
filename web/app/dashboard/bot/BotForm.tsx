"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/app/components/Sidebar";
import { Sekce, Pole, Toggle, LockInput, btnPrimary, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

type Nastaveni = {
  user_id: string;
  telegram_token: string;
  telegram_chat_id: string;
  dalsi_prijemci: string[];
  aktivni: boolean;
  trh: Trh;
};

export default function BotForm({ email, nastaveni }: { email: string; nastaveni: Nastaveni | null }) {
  const supabase = createClient();
  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? {
      user_id: "", telegram_token: "", telegram_chat_id: "",
      dalsi_prijemci: [], aktivni: true, trh: "cz",
    }
  );
  const t = T(n.trh);
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);
  const [testuje, setTestuje] = useState(false);

  async function ulozit() {
    setUklada(true);
    setZprava(null);
    const { error } = await supabase
      .from("nastaveni")
      .update({
        telegram_token: n.telegram_token,
        telegram_chat_id: n.telegram_chat_id,
        dalsi_prijemci: n.dalsi_prijemci,
        aktivni: n.aktivni,
      })
      .eq("user_id", n.user_id);
    setUklada(false);
    setZprava(error ? t.chybaUkladani + error.message : t.ulozeno);
  }

  async function testSpojeni() {
    setTestuje(true);
    setZprava(null);
    try {
      const r = await fetch(`https://api.telegram.org/bot${n.telegram_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: n.telegram_chat_id, text: "✅ FlipniTo – test spojení funguje!" }),
      });
      const j = await r.json();
      setZprava(j.ok ? t.testOk : t.telegramChyba + (j.description || t.neznama));
    } catch (e: any) {
      setZprava(t.chybaSite + e.message);
    } finally {
      setTestuje(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} trh={n.trh} userId={n.user_id} />
      <main className="flex-1 px-8 py-8">
        <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.nastaveniBota}</h1>

        <Sekce titulek={t.telegramBot} badge={n.aktivni ? { text: t.aktivni, tone: "green" } : { text: t.pozastaveno, tone: "zinc" }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Pole label={t.tokenBota}>
              <LockInput value={n.telegram_token} onChange={(v) => setN({ ...n, telegram_token: v })} />
            </Pole>
            <Pole label={t.tvojeChatId}>
              <LockInput value={n.telegram_chat_id} onChange={(v) => setN({ ...n, telegram_chat_id: v })} />
            </Pole>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={testSpojeni}
              disabled={testuje || !n.telegram_token || !n.telegram_chat_id}
              className={btnGhost}
            >
              {testuje ? t.testuji : t.testSpojeni}
            </button>
            <Toggle checked={n.aktivni} onChange={(v) => setN({ ...n, aktivni: v })} label={t.botAktivni} />
          </div>
        </Sekce>

        <button onClick={ulozit} disabled={uklada} className={btnPrimary}>
          {uklada ? t.ukladam : t.ulozitNastaveni}
        </button>
        {zprava && (
          <p className={`mt-3 text-sm ${zprava.startsWith("Chyb") ? "text-red-400" : "text-accent"}`}>{zprava}</p>
        )}
      </main>
    </div>
  );
}
