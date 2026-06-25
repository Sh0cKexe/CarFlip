"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sekce, Pole, input, btnPrimary, btnGhost } from "@/app/components/FormUI";
import Logo from "@/app/components/Logo";

export type Clen = { user_id: string; email: string; pristup_do: string | null; posledni_chyba: string | null; posledni_beh: string | null };
export type NepouzityKod = { kod: string; dny_platnosti: number; vytvoreno: string };

function dnyDoVyprseni(pristup_do: string | null): number | null {
  if (!pristup_do) return null;
  return Math.ceil((new Date(pristup_do).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDatum(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ");
}

export default function AdminPanel({
  clenove, nepouziteKody, udrzbaAktivni,
}: { clenove: Clen[]; nepouziteKody: NepouzityKod[]; udrzbaAktivni: boolean }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo height={30} />
          <h1 className="text-xl font-semibold text-zinc-100">Admin</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-zinc-400 transition hover:text-zinc-200">
          ← Zpět do appky
        </Link>
      </div>

      <UdrzbaToggle aktivni={udrzbaAktivni} />
      <NoveKody nepouziteKody={nepouziteKody} />
      <Clenove clenove={clenove} />
    </main>
  );
}

function UdrzbaToggle({ aktivni: aktivniVychozi }: { aktivni: boolean }) {
  const [aktivni, setAktivni] = useState(aktivniVychozi);
  const [pracuje, setPracuje] = useState(false);

  async function prepnout() {
    setPracuje(true);
    const novaHodnota = !aktivni;
    try {
      const r = await fetch("/api/admin/udrzba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ udrzba: novaHodnota }),
      });
      if (r.ok) setAktivni(novaHodnota);
    } finally {
      setPracuje(false);
    }
  }

  return (
    <Sekce titulek="Údržba stránky">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-200">
            {aktivni ? "🔴 Údržba je zapnutá — návštěvníci vidí stránku /udrzba" : "🟢 Stránka běží normálně"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Admin a /api/admin jsou přístupné i při údržbě.
          </p>
        </div>
        <button
          onClick={prepnout}
          disabled={pracuje}
          className={`min-w-[120px] rounded-xl px-4 py-2 text-sm font-semibold transition ${
            aktivni
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-accent/15 text-accent hover:bg-accent/25"
          }`}
        >
          {pracuje ? "Ukládám..." : aktivni ? "Vypnout údržbu" : "Zapnout údržbu"}
        </button>
      </div>
    </Sekce>
  );
}

function NoveKody({ nepouziteKody: nepouziteKodyVychozi }: { nepouziteKody: NepouzityKod[] }) {
  const [nepouziteKody, setNepouziteKody] = useState(nepouziteKodyVychozi);
  const [dny, setDny] = useState("30");
  const [generuji, setGeneruji] = useState(false);
  const [novyKod, setNovyKod] = useState<string | null>(null);
  const [chyba, setChyba] = useState<string | null>(null);

  async function vygenerovat() {
    setGeneruji(true);
    setChyba(null);
    setNovyKod(null);
    try {
      const r = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dny_platnosti: Number(dny) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Nepodařilo se vygenerovat kód.");
      setNovyKod(j.kod);
      setNepouziteKody((prev) => [{ kod: j.kod, dny_platnosti: Number(dny), vytvoreno: new Date().toISOString() }, ...prev]);
    } catch (e: any) {
      setChyba(e.message);
    } finally {
      setGeneruji(false);
    }
  }

  async function smazatKod(kod: string) {
    if (!confirm(`Smazat kód ${kod}?`)) return;
    await fetch("/api/admin/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kod }),
    });
    setNepouziteKody((prev) => prev.filter((k) => k.kod !== kod));
  }

  return (
    <Sekce titulek="Nový invite kód">
      <div className="flex flex-wrap items-end gap-3">
        <Pole label="Platnost (dní)">
          <input type="number" className={`${input} w-32`} value={dny} onChange={(e) => setDny(e.target.value)} />
        </Pole>
        <button onClick={vygenerovat} disabled={generuji} className={btnPrimary}>
          {generuji ? "Generuji..." : "Vygenerovat kód"}
        </button>
      </div>

      {novyKod && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 font-mono text-sm text-accent"
        >
          {novyKod}
        </motion.p>
      )}
      {chyba && <p className="mt-3 text-sm text-red-400">{chyba}</p>}

      {nepouziteKody.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-border/60 pt-4">
          <p className="mb-1 text-xs text-zinc-500">Nepoužité kódy:</p>
          {nepouziteKody.map((k) => (
            <div key={k.kod} className="flex items-center justify-between text-sm">
              <span className="font-mono text-zinc-300">{k.kod}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{k.dny_platnosti} dní</span>
                <button
                  onClick={() => smazatKod(k.kod)}
                  className="text-xs text-red-400 transition hover:text-red-300"
                >
                  Zrušit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sekce>
  );
}

function Clenove({ clenove }: { clenove: Clen[] }) {
  return (
    <Sekce titulek="Členové">
      <div className="space-y-2">
        {clenove.length === 0 && <p className="text-sm text-zinc-500">Žádní členové.</p>}
        {clenove.map((c) => <ClenRadek key={c.user_id} clen={c} />)}
      </div>
    </Sekce>
  );
}

function ClenRadek({ clen }: { clen: Clen }) {
  const [dny, setDny] = useState("30");
  const [pracuje, setPracuje] = useState(false);
  const [zprava, setZprava] = useState<string | null>(null);
  const [heslo, setHeslo] = useState<string | null>(null);
  const [pristupDo, setPristupDo] = useState(clen.pristup_do);

  const zbyva = dnyDoVyprseni(pristupDo);

  async function prodlouzit() {
    setPracuje(true);
    setZprava(null);
    try {
      const r = await fetch("/api/admin/prodlouzit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: clen.user_id, dny: Number(dny) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Nepodařilo se prodloužit.");
      setPristupDo(j.pristup_do);
      setZprava(`Prodlouženo do ${formatDatum(j.pristup_do)}.`);
    } catch (e: any) {
      setZprava("Chyba: " + e.message);
    } finally {
      setPracuje(false);
    }
  }

  async function resetovatHeslo() {
    if (!confirm(`Vygenerovat nové heslo pro ${clen.email}? Staré přestane platit.`)) return;
    setPracuje(true);
    setZprava(null);
    setHeslo(null);
    try {
      const r = await fetch("/api/admin/reset-heslo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: clen.user_id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Nepodařilo se resetovat heslo.");
      setHeslo(j.heslo);
    } catch (e: any) {
      setZprava("Chyba: " + e.message);
    } finally {
      setPracuje(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-panel2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-100">{clen.email}</p>
          <p className={`text-xs ${zbyva != null && zbyva <= 3 ? "text-red-400" : "text-zinc-500"}`}>
            {pristupDo ? `do ${formatDatum(pristupDo)} (${zbyva} dní)` : "bez přístupu"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={dny}
            onChange={(e) => setDny(e.target.value)}
            className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-zinc-100 outline-none"
          />
          <button onClick={prodlouzit} disabled={pracuje} className={btnGhost}>
            +dní
          </button>
          <button onClick={resetovatHeslo} disabled={pracuje} className={btnGhost}>
            Reset heslo
          </button>
        </div>
      </div>
      {clen.posledni_chyba && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2">
          <p className="mb-1 text-xs font-medium text-red-400">⚠️ Chyba bota:</p>
          <p className="font-mono text-xs text-red-400 break-all">{clen.posledni_chyba}</p>
          {clen.posledni_beh && (
            <p className="mt-1 text-xs text-zinc-500">Poslední OK běh: {new Date(clen.posledni_beh).toLocaleString("cs-CZ")}</p>
          )}
        </div>
      )}
      {heslo && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-lg border border-accent2/40 bg-accent2/10 px-4 py-2.5 font-mono text-sm text-accent2"
        >
          Nové heslo: {heslo}
        </motion.p>
      )}
      {zprava && <p className="mt-2 text-xs text-zinc-400">{zprava}</p>}
    </div>
  );
}
