"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { T, type Trh } from "@/lib/i18n";

const LANG_KLIC = "carflip_lang";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [heslo, setHeslo] = useState("");
  const [zprava, setZprava] = useState<string | null>(null);
  const [pracuje, setPracuje] = useState(false);
  const [trh, setTrh] = useState<Trh>("cz");
  const t = T(trh);

  useEffect(() => {
    const ulozeny = localStorage.getItem(LANG_KLIC);
    if (ulozeny === "cz" || ulozeny === "sk") setTrh(ulozeny);
  }, []);

  function zmenitJazyk(novy: Trh) {
    setTrh(novy);
    localStorage.setItem(LANG_KLIC, novy);
  }

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
        const { error } = await supabase.auth.signUp({ email, password: heslo });
        if (error) throw error;
        setZprava(t.registraceOk);
        setMode("login");
      }
    } catch (err: any) {
      setZprava("Chyba: " + (err?.message || String(err)));
    } finally {
      setPracuje(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={odeslat}
        className="w-full max-w-sm rounded-2xl border border-border bg-panel p-8 shadow-xl shadow-black/40"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <h1 className="text-xl font-semibold tracking-tight">CarFlip</h1>
          </div>
          <div className="flex gap-1">
            <button
              type="button" onClick={() => zmenitJazyk("cz")}
              className={`rounded-md px-2 py-1 text-lg ${trh === "cz" ? "bg-panel2" : "opacity-50"}`}
            >
              🇨🇿
            </button>
            <button
              type="button" onClick={() => zmenitJazyk("sk")}
              className={`rounded-md px-2 py-1 text-lg ${trh === "sk" ? "bg-panel2" : "opacity-50"}`}
            >
              🇸🇰
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-panel2 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md py-2 transition ${
              mode === "login" ? "bg-accent2 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.prihlasit}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-md py-2 transition ${
              mode === "register" ? "bg-accent2 text-white" : "text-zinc-400 hover:text-zinc-200"
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
          className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none ring-accent2 focus:ring-2"
        />

        <label className="mb-1 block text-xs text-zinc-400">{t.heslo}</label>
        <input
          type="password"
          required
          minLength={6}
          value={heslo}
          onChange={(e) => setHeslo(e.target.value)}
          className="mb-6 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none ring-accent2 focus:ring-2"
        />

        <button
          type="submit"
          disabled={pracuje}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
        >
          {pracuje ? t.pracuji : mode === "login" ? t.prihlasitSe : t.vytvoritUcet}
        </button>

        {zprava && (
          <p className={`mt-4 text-sm ${zprava.startsWith("Chyba") ? "text-red-400" : "text-emerald-400"}`}>
            {zprava}
          </p>
        )}
      </form>
    </main>
  );
}
