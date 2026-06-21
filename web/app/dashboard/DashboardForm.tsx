"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Oblast = { nazev: string; mesto_slug: string; okruh_km: number };

type Filtry = {
  znacky: string[];
  palivo: string;
  prevodovka: string;
  oblasti: Oblast[];
  min_rok: number;
  max_najezd_nafta: number;
  max_najezd_benzin: number;
  max_cena_pln: number;
  min_cena_pln: number;
};

type Nastaveni = {
  user_id: string;
  telegram_token: string;
  telegram_chat_id: string;
  dalsi_prijemci: string[];
  filtry: Filtry;
  min_zisk_kc: number;
  naklady_dovoz_kc: number;
  min_srovnani: number;
  aktivni: boolean;
};

export default function DashboardForm({ email, nastaveni }: { email: string; nastaveni: Nastaveni | null }) {
  const router = useRouter();
  const supabase = createClient();

  const [n, setN] = useState<Nastaveni>(
    nastaveni ?? {
      user_id: "",
      telegram_token: "",
      telegram_chat_id: "",
      dalsi_prijemci: [],
      filtry: {
        znacky: [], palivo: "vse", prevodovka: "vse", oblasti: [],
        min_rok: 2003, max_najezd_nafta: 250000, max_najezd_benzin: 200000,
        max_cena_pln: 12501, min_cena_pln: 0,
      },
      min_zisk_kc: 20000, naklady_dovoz_kc: 10000, min_srovnani: 3, aktivni: true,
    }
  );
  const [zprava, setZprava] = useState<string | null>(null);
  const [uklada, setUklada] = useState(false);
  const [testuje, setTestuje] = useState(false);

  function setFiltr<K extends keyof Filtry>(klic: K, hodnota: Filtry[K]) {
    setN({ ...n, filtry: { ...n.filtry, [klic]: hodnota } });
  }

  function pridatOblast() {
    setFiltr("oblasti", [...n.filtry.oblasti, { nazev: "", mesto_slug: "", okruh_km: 50 }]);
  }
  function odebratOblast(i: number) {
    setFiltr("oblasti", n.filtry.oblasti.filter((_, idx) => idx !== i));
  }
  function upravitOblast(i: number, klic: keyof Oblast, hodnota: string | number) {
    const kopie = [...n.filtry.oblasti];
    kopie[i] = { ...kopie[i], [klic]: hodnota };
    setFiltr("oblasti", kopie);
  }

  async function ulozit() {
    setUklada(true);
    setZprava(null);
    const { error } = await supabase
      .from("nastaveni")
      .update({
        telegram_token: n.telegram_token,
        telegram_chat_id: n.telegram_chat_id,
        dalsi_prijemci: n.dalsi_prijemci,
        filtry: n.filtry,
        min_zisk_kc: n.min_zisk_kc,
        naklady_dovoz_kc: n.naklady_dovoz_kc,
        min_srovnani: n.min_srovnani,
        aktivni: n.aktivni,
      })
      .eq("user_id", n.user_id);
    setUklada(false);
    setZprava(error ? "Chyba při ukládání: " + error.message : "Uloženo.");
  }

  async function testSpojeni() {
    setTestuje(true);
    setZprava(null);
    try {
      const r = await fetch(
        `https://api.telegram.org/bot${n.telegram_token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: n.telegram_chat_id, text: "✅ CarFlip – test spojení funguje!" }),
        }
      );
      const j = await r.json();
      setZprava(j.ok ? "Test OK, zpráva odeslána na Telegram." : "Telegram chyba: " + (j.description || "neznámá"));
    } catch (e: any) {
      setZprava("Chyba sítě: " + e.message);
    } finally {
      setTestuje(false);
    }
  }

  async function odhlasit() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>CarFlip nastavení</h1>
        <div>
          <span style={{ marginRight: 12, color: "#999" }}>{email}</span>
          <button onClick={odhlasit} style={ghostBtn}>Odhlásit</button>
        </div>
      </div>

      <Sekce titulek="Telegram bot">
        <Pole label="Token bota">
          <input style={input} value={n.telegram_token} onChange={(e) => setN({ ...n, telegram_token: e.target.value })} />
        </Pole>
        <Pole label="Tvoje chat ID">
          <input style={input} value={n.telegram_chat_id} onChange={(e) => setN({ ...n, telegram_chat_id: e.target.value })} />
        </Pole>
        <Pole label="Další příjemci (chat ID, čárkou)">
          <input style={input} value={n.dalsi_prijemci.join(", ")}
            onChange={(e) => setN({ ...n, dalsi_prijemci: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
        </Pole>
        <button type="button" onClick={testSpojeni} disabled={testuje || !n.telegram_token || !n.telegram_chat_id} style={ghostBtn}>
          {testuje ? "Testuji..." : "Test spojení"}
        </button>
        <label style={{ display: "block", marginTop: 12 }}>
          <input type="checkbox" checked={n.aktivni} onChange={(e) => setN({ ...n, aktivni: e.target.checked })} /> Bot aktivní (hledat a posílat)
        </label>
      </Sekce>

      <Sekce titulek="Filtry aut">
        <Pole label="Značky (čárkou, malými písmeny, např. skoda, volkswagen)">
          <input style={input} value={n.filtry.znacky.join(", ")}
            onChange={(e) => setFiltr("znacky", e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))} />
        </Pole>
        <Pole label="Palivo">
          <select style={input} value={n.filtry.palivo} onChange={(e) => setFiltr("palivo", e.target.value)}>
            <option value="vse">vše</option>
            <option value="benzin">benzín</option>
            <option value="diesel">diesel</option>
          </select>
        </Pole>
        <Pole label="Převodovka">
          <select style={input} value={n.filtry.prevodovka} onChange={(e) => setFiltr("prevodovka", e.target.value)}>
            <option value="vse">vše</option>
            <option value="manual">manuál</option>
            <option value="automat">automat</option>
          </select>
        </Pole>
        <Radek>
          <Pole label="Rok od"><input type="number" style={input} value={n.filtry.min_rok} onChange={(e) => setFiltr("min_rok", Number(e.target.value))} /></Pole>
          <Pole label="Max nájezd diesel (km)"><input type="number" style={input} value={n.filtry.max_najezd_nafta} onChange={(e) => setFiltr("max_najezd_nafta", Number(e.target.value))} /></Pole>
          <Pole label="Max nájezd benzín (km)"><input type="number" style={input} value={n.filtry.max_najezd_benzin} onChange={(e) => setFiltr("max_najezd_benzin", Number(e.target.value))} /></Pole>
        </Radek>
        <Radek>
          <Pole label="Cena PL od (PLN)"><input type="number" style={input} value={n.filtry.min_cena_pln} onChange={(e) => setFiltr("min_cena_pln", Number(e.target.value))} /></Pole>
          <Pole label="Cena PL do (PLN)"><input type="number" style={input} value={n.filtry.max_cena_pln} onChange={(e) => setFiltr("max_cena_pln", Number(e.target.value))} /></Pole>
        </Radek>

        <p style={{ marginTop: 16, marginBottom: 4, fontWeight: 600 }}>Oblasti v Polsku (prázdné = celé Polsko)</p>
        {n.filtry.oblasti.map((o, i) => (
          <Radek key={i}>
            <Pole label="Název"><input style={input} value={o.nazev} onChange={(e) => upravitOblast(i, "nazev", e.target.value)} /></Pole>
            <Pole label="Slug města (např. wroclaw)"><input style={input} value={o.mesto_slug} onChange={(e) => upravitOblast(i, "mesto_slug", e.target.value)} /></Pole>
            <Pole label="Okruh (km)"><input type="number" style={input} value={o.okruh_km} onChange={(e) => upravitOblast(i, "okruh_km", Number(e.target.value))} /></Pole>
            <button type="button" onClick={() => odebratOblast(i)} style={ghostBtn}>Smazat</button>
          </Radek>
        ))}
        <button type="button" onClick={pridatOblast} style={ghostBtn}>+ Přidat oblast</button>
      </Sekce>

      <Sekce titulek="Ziskovost">
        <Radek>
          <Pole label="Minimální zisk (Kč)"><input type="number" style={input} value={n.min_zisk_kc} onChange={(e) => setN({ ...n, min_zisk_kc: Number(e.target.value) })} /></Pole>
          <Pole label="Náklady dovoz (Kč)"><input type="number" style={input} value={n.naklady_dovoz_kc} onChange={(e) => setN({ ...n, naklady_dovoz_kc: Number(e.target.value) })} /></Pole>
          <Pole label="Min. srovnatelných inzerátů"><input type="number" style={input} value={n.min_srovnani} onChange={(e) => setN({ ...n, min_srovnani: Number(e.target.value) })} /></Pole>
        </Radek>
      </Sekce>

      <button onClick={ulozit} disabled={uklada} style={saveBtn}>{uklada ? "Ukládám..." : "Uložit nastavení"}</button>
      {zprava && <p style={{ color: zprava.startsWith("Chyba") ? "#f87171" : "#4ade80" }}>{zprava}</p>}
    </main>
  );
}

function Sekce({ titulek, children }: { titulek: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#1a1d24", borderRadius: 12, padding: 20, marginTop: 20 }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>{titulek}</h2>
      {children}
    </section>
  );
}
function Radek({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>{children}</div>;
}
function Pole({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12, flex: "1 1 160px" }}>
      <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "#aaa" }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%", padding: 8, borderRadius: 8, border: "1px solid #333",
  background: "#11141a", color: "#eee", boxSizing: "border-box",
};
const ghostBtn: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8, border: "1px solid #3b82f6",
  background: "transparent", color: "#3b82f6", cursor: "pointer",
};
const saveBtn: React.CSSProperties = {
  marginTop: 20, padding: "12px 24px", borderRadius: 8, border: "none",
  background: "#22c55e", color: "#06210f", fontWeight: 600, cursor: "pointer", fontSize: 16,
};
