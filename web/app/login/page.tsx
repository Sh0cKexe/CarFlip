"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [heslo, setHeslo] = useState("");
  const [zprava, setZprava] = useState<string | null>(null);
  const [pracuje, setPracuje] = useState(false);

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
        setZprava("Registrace OK. Pokud projekt vyžaduje potvrzení e-mailu, zkontroluj schránku, jinak se hned přihlas.");
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
        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <h1 className="text-xl font-semibold tracking-tight">CarFlip</h1>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-panel2 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md py-2 transition ${
              mode === "login" ? "bg-accent2 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Přihlásit
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-md py-2 transition ${
              mode === "register" ? "bg-accent2 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Registrovat
          </button>
        </div>

        <label className="mb-1 block text-xs text-zinc-400">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none ring-accent2 focus:ring-2"
        />

        <label className="mb-1 block text-xs text-zinc-400">Heslo</label>
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
          {pracuje ? "Pracuji..." : mode === "login" ? "Přihlásit se" : "Vytvořit účet"}
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
