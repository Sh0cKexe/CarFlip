"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { T, type Trh } from "@/lib/i18n";
import { DISCORD_URL, DISCORD_HANDLE } from "@/lib/discord";
import Logo from "@/app/components/Logo";

const LANG_KLIC = "carflip_lang";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFormulare />
    </Suspense>
  );
}

function LoginFormulare() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [heslo, setHeslo] = useState("");
  const [kod, setKod] = useState("");
  const [zprava, setZprava] = useState<string | null>(null);
  const [pracuje, setPracuje] = useState(false);
  const [trh, setTrh] = useState<Trh>("cz");
  const t = T(trh);

  useEffect(() => {
    const ulozeny = localStorage.getItem(LANG_KLIC);
    if (ulozeny === "cz" || ulozeny === "sk") setTrh(ulozeny);
    if (searchParams.get("vyprselo")) setZprava(t.pristupVyprsel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function odeslat(e: React.FormEvent) {
    e.preventDefault();
    setZprava(null);
    setPracuje(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: heslo });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const r = await fetch("/api/registrace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, heslo, kod }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Registrace se nezdařila.");
        const { error } = await supabase.auth.signInWithPassword({ email, password: heslo });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setZprava("Chyba: " + (err?.message || String(err)));
    } finally {
      setPracuje(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-10">
      <motion.form
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onSubmit={odeslat}
        className="glass w-full max-w-sm rounded-2xl border border-border p-8 shadow-glow-lg"
      >
        <div className="mb-6 flex items-center justify-center">
          <Logo height={34} />
        </div>

        <div className="relative mb-6 grid grid-cols-2 rounded-lg bg-panel2 p-1 text-sm">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-md bg-gradient-to-r from-accent to-accent2 shadow-glow"
            style={{ left: mode === "login" ? "0.25rem" : "calc(50% + 0rem)" }}
          />
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`relative z-10 rounded-md py-2 transition ${
              mode === "login" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.prihlasit}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`relative z-10 rounded-md py-2 transition ${
              mode === "register" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.registrovat}
          </button>
        </div>

        <label className="mb-1 block text-xs text-zinc-400">{t.email}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-accent2/60 focus:ring-2 focus:ring-accent2"
        />

        <label className="mb-1 block text-xs text-zinc-400">{t.heslo}</label>
        <input
          type="password"
          required
          minLength={6}
          value={heslo}
          onChange={(e) => setHeslo(e.target.value)}
          className={`w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-accent2/60 focus:ring-2 focus:ring-accent2 ${mode === "register" ? "mb-4" : "mb-6"}`}
        />

        <AnimatePresence>
          {mode === "register" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <label className="mb-1 block text-xs text-zinc-400">{t.inviteKod}</label>
              <input
                required
                value={kod}
                onChange={(e) => setKod(e.target.value)}
                className="mb-6 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-accent2/60 focus:ring-2 focus:ring-accent2"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={pracuje}
          className="w-full rounded-lg bg-gradient-to-r from-accent to-accent2 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:shadow-glow-lg disabled:opacity-60"
        >
          {pracuje ? t.pracuji : mode === "login" ? t.prihlasitSe : t.vytvoritUcet}
        </motion.button>

        <AnimatePresence>
          {zprava && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 text-sm ${zprava.startsWith("Chyba") ? "text-red-400" : "text-accent"}`}
            >
              {zprava}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        className="glass w-full max-w-sm rounded-2xl border border-border p-5 text-center shadow-glow"
      >
        <p className="text-sm font-semibold text-white">{t.nemasInviteKod}</p>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-accent2/50 px-5 py-2.5 text-sm font-semibold text-accent2 transition hover:border-accent2 hover:bg-accent2/10 active:scale-[0.97]"
        >
          💬 Připojit se na Discord
        </a>
        <p className="mt-3 text-sm text-zinc-300">Nejde link? Discord: {DISCORD_HANDLE}</p>
      </motion.div>
    </main>
  );
}
