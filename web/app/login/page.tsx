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
    <main style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={odeslat} style={{ width: 360, padding: 32, background: "#1a1d24", borderRadius: 12 }}>
        <h1 style={{ marginTop: 0 }}>CarFlip</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button type="button" onClick={() => setMode("login")}
            style={tabStyle(mode === "login")}>Přihlásit</button>
          <button type="button" onClick={() => setMode("register")}
            style={tabStyle(mode === "register")}>Registrovat</button>
        </div>
        <label style={labelStyle}>E-mail</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Heslo</label>
        <input type="password" required minLength={6} value={heslo} onChange={(e) => setHeslo(e.target.value)} style={inputStyle} />
        <button type="submit" disabled={pracuje} style={submitStyle}>
          {pracuje ? "Pracuji..." : mode === "login" ? "Přihlásit se" : "Vytvořit účet"}
        </button>
        {zprava && <p style={{ color: zprava.startsWith("Chyba") ? "#f87171" : "#4ade80", fontSize: 14 }}>{zprava}</p>}
      </form>
    </main>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
    background: active ? "#3b82f6" : "#2a2e37", color: "#fff",
  };
}
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, marginBottom: 4, marginTop: 12 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333",
  background: "#11141a", color: "#eee", boxSizing: "border-box",
};
const submitStyle: React.CSSProperties = {
  width: "100%", marginTop: 20, padding: 12, borderRadius: 8, border: "none",
  background: "#22c55e", color: "#06210f", fontWeight: 600, cursor: "pointer",
};
