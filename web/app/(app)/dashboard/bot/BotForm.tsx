"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Sekce, Pole, Toggle, LockInput, btnPrimary, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

type Nastaveni = {
  user_id: string;
  telegram_token: string;
  telegram_chat_id: string;
  dalsi_prijemci: string[];
  aktivni: boolean;
  trh: Trh;
  posledni_beh: string | null;
  najdi_ted_stav: string | null;
  posledni_najdi_ted: string | null;
  najdi_ted_spusteno: string | null;
  posledni_chyba: string | null;
};

const BOT_PRAH_MINUT = 20; // cron jede kazdych 15 min, +rezerva nez se to bere jako problem

function formatPredCasem(iso: string | null, t: ReturnType<typeof T>): string {
  if (!iso) return t.nikdyNebehl;
  const minuty = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minuty < 60) return t.predMinutami.replace("{n}", String(minuty));
  return t.predHodinami.replace("{n}", String(Math.floor(minuty / 60)));
}

function statusBota(n: Nastaveni, t: ReturnType<typeof T>): { badge: string; text: string; tone: "green" | "red" | "zinc" } {
  if (!n.aktivni) return { badge: t.botBadgeVypnuto, text: t.botVypnuty, tone: "zinc" };
  if (!n.posledni_beh) return { badge: t.botBadgeCeka, text: t.botCekaPrvniKontrola, tone: "zinc" };
  const minuty = Math.floor((Date.now() - new Date(n.posledni_beh).getTime()) / 60000);
  if (minuty <= BOT_PRAH_MINUT) {
    return { badge: t.botBadgeBezi, text: `${t.botBezi} – ${t.posledniKontrola.toLowerCase()}: ${formatPredCasem(n.posledni_beh, t)}`, tone: "green" };
  }
  return { badge: t.botBadgeProblem, text: `${t.botDlouhoBezKontroly} (${t.posledniKontrola.toLowerCase()}: ${formatPredCasem(n.posledni_beh, t)})`, tone: "red" };
}

const COOLDOWN_MINUT = 60;
const STUCK_MS = 20 * 60000;

export default function BotForm({ nastaveni }: { nastaveni: Nastaveni | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? {
      user_id: "", telegram_token: "", telegram_chat_id: "",
      dalsi_prijemci: [], aktivni: true, trh: "cz", posledni_beh: null,
      najdi_ted_stav: null, posledni_najdi_ted: null, najdi_ted_spusteno: null, posledni_chyba: null,
    }
  );
  const t = T(n.trh);
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);
  const [testuje, setTestuje] = useState(false);
  const [navodOtevreno, setNavodOtevreno] = useState(false);
  const [spoustimNajdi, setSpoustimNajdi] = useState(false);

  // Sync najdit-ted status fields from server after router.refresh()
  useEffect(() => {
    if (!nastaveni) return;
    setN(prev => ({
      ...prev,
      najdi_ted_stav: nastaveni.najdi_ted_stav,
      posledni_najdi_ted: nastaveni.posledni_najdi_ted,
      najdi_ted_spusteno: nastaveni.najdi_ted_spusteno,
      posledni_chyba: nastaveni.posledni_chyba,
      posledni_beh: nastaveni.posledni_beh,
    }));
  }, [nastaveni?.najdi_ted_stav, nastaveni?.posledni_najdi_ted, nastaveni?.posledni_beh, nastaveni?.posledni_chyba]);

  const behZaseknuty = !!n.najdi_ted_spusteno && Date.now() - new Date(n.najdi_ted_spusteno).getTime() > STUCK_MS;
  const jeBezi = n.najdi_ted_stav === "bezi" && !behZaseknuty;
  const cooldownZbyva = n.posledni_najdi_ted && !jeBezi
    ? Math.max(0, COOLDOWN_MINUT - Math.floor((Date.now() - new Date(n.posledni_najdi_ted).getTime()) / 60000))
    : 0;

  // Poll for status update while running
  useEffect(() => {
    if (!jeBezi) return;
    const id = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(id);
  }, [jeBezi, router]);

  async function ulozit() {
    if (n.aktivni && (!n.telegram_token.trim() || !n.telegram_chat_id.trim())) {
      setZprava(t.vyplnTokenChatId);
      return;
    }
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

  async function spustitNajdiTed() {
    setSpoustimNajdi(true);
    try {
      const r = await fetch("/api/najdi-ted", { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        if (j.error === "cooldown") {
          setZprava(`${t.najdiTedCooldown} ${j.zbyvaMinut} ${t.najdiTedMinut}.`);
        } else if (j.error === "bezi") {
          setN(prev => ({ ...prev, najdi_ted_stav: "bezi" }));
        } else {
          setZprava(j.error || t.neznama);
        }
      } else {
        setN(prev => ({ ...prev, najdi_ted_stav: "bezi", najdi_ted_spusteno: new Date().toISOString() }));
      }
    } catch (e: any) {
      setZprava(t.chybaSite + e.message);
    } finally {
      setSpoustimNajdi(false);
    }
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
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.nastaveniBota}</h1>

        <Sekce titulek={t.telegramBot} badge={{ text: statusBota(n, t).badge, tone: statusBota(n, t).tone }}>
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
          <p className={`mt-3 text-sm font-medium ${
            statusBota(n, t).tone === "green" ? "text-accent" : statusBota(n, t).tone === "red" ? "text-red-400" : "text-zinc-400"
          }`}>
            {statusBota(n, t).text}
          </p>
          {statusBota(n, t).tone === "red" && n.posledni_chyba && (
            <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 font-mono text-xs text-red-400">
              {n.posledni_chyba}
            </p>
          )}
        </Sekce>

        <Sekce titulek={t.najdiTed}>
          {jeBezi ? (
            <div className="flex items-center gap-2 text-sm text-accent">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              {t.najdiTedBezi}
            </div>
          ) : cooldownZbyva > 0 ? (
            <div>
              <button disabled className={`${btnGhost} opacity-50`}>{t.najdiTed}</button>
              <p className="mt-2 text-xs text-zinc-500">{t.najdiTedCooldown} {cooldownZbyva} {t.najdiTedMinut}.</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={spustitNajdiTed}
              disabled={spoustimNajdi || !n.aktivni || !n.telegram_token || !n.telegram_chat_id}
              className={btnGhost}
            >
              {spoustimNajdi ? t.najdiTedSpoustim : `🔎 ${t.najdiTed}`}
            </button>
          )}
          {!jeBezi && n.najdi_ted_stav === "hotovo" && (
            <p className="mt-2 text-sm text-accent">{t.najdiTedHotovo}</p>
          )}
          {!jeBezi && n.najdi_ted_stav === "chyba" && (
            <p className="mt-2 text-sm text-red-400">{t.najdiTedChyba}</p>
          )}
        </Sekce>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="glass mb-6 overflow-hidden rounded-2xl border border-border shadow-glow"
        >
          <button
            type="button"
            onClick={() => setNavodOtevreno(!navodOtevreno)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <h2 className="text-base font-semibold text-zinc-100">{t.navodBota}</h2>
            <span className={`text-zinc-400 transition-transform ${navodOtevreno ? "rotate-180" : ""}`}>▾</span>
          </button>
          <AnimatePresence initial={false}>
            {navodOtevreno && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <div className="overflow-hidden rounded-lg" style={{ aspectRatio: "16 / 9", maxWidth: 320 }}>
                    <iframe
                      src="https://www.youtube.com/embed/t5JoCTcf8bI"
                      title={t.navodBota}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{t.navodVideoPopisek}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <button onClick={ulozit} disabled={uklada} className={btnPrimary}>
          {uklada ? t.ukladam : t.ulozitNastaveni}
        </button>
        {zprava && (
          <p className={`mt-3 text-sm ${zprava.startsWith("Chyb") || zprava === t.vyplnTokenChatId ? "text-red-400" : "text-accent"}`}>{zprava}</p>
      )}
    </main>
  );
}
