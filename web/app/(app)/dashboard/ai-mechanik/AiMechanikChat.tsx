"use client";

import { useState } from "react";
import { Sekce, Pole, input, btnGhost, btnPrimary } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

type Zprava = { role: "user" | "assistant"; obsah: string };
type Auto = { znacka: string; model: string; rok: string; motor: string; vykon: string };

export default function AiMechanikChat({ trh }: { trh: Trh }) {
  const t = T(trh);
  const [auto, setAuto] = useState<Auto>({ znacka: "", model: "", rok: "", motor: "", vykon: "" });
  const [chatZacat, setChatZacat] = useState(false);
  const [zpravy, setZpravy] = useState<Zprava[]>([]);
  const [vstup, setVstup] = useState("");
  const [bezi, setBezi] = useState(false);
  const [chyba, setChyba] = useState<string | null>(null);

  const autoVyplneno = auto.znacka && auto.model && auto.rok && auto.motor && auto.vykon;

  async function poslat() {
    if (!vstup.trim()) return;
    const novaHistorie: Zprava[] = [...zpravy, { role: "user", obsah: vstup }];
    setZpravy(novaHistorie);
    setVstup("");
    setBezi(true);
    setChyba(null);
    try {
      const r = await fetch("/api/ai-mechanik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto, zprava: vstup, historie: zpravy, jazyk: trh }),
      });
      const j = await r.json();
      if (!r.ok) {
        setChyba(j.error || t.neznama);
        return;
      }
      setZpravy([...novaHistorie, { role: "assistant", obsah: j.text }]);
    } catch (e: any) {
      setChyba(t.chybaSite + e.message);
    } finally {
      setBezi(false);
    }
  }

  function novyAuto() {
    setChatZacat(false);
    setZpravy([]);
    setAuto({ znacka: "", model: "", rok: "", motor: "", vykon: "" });
  }

  if (!chatZacat) {
    return (
      <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <h1 className="mb-6 text-xl font-semibold text-zinc-100">{t.aiMechanikNadpis}</h1>
        <Sekce titulek={t.aiMechanikNadpis}>
          <p className="mb-4 text-sm text-zinc-400">{t.vyplnUdajeAuta}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Pole label={t.mechZnacka}>
              <input className={input} value={auto.znacka} onChange={(e) => setAuto({ ...auto, znacka: e.target.value })} placeholder="Škoda" />
            </Pole>
            <Pole label={t.mechModel}>
              <input className={input} value={auto.model} onChange={(e) => setAuto({ ...auto, model: e.target.value })} placeholder="Octavia 2" />
            </Pole>
            <Pole label={t.rokVyroby}>
              <input type="number" className={input} value={auto.rok} onChange={(e) => setAuto({ ...auto, rok: e.target.value })} />
            </Pole>
            <Pole label={t.mechMotor}>
              <input className={input} value={auto.motor} onChange={(e) => setAuto({ ...auto, motor: e.target.value })} placeholder="1.9 TDI" />
            </Pole>
            <Pole label={t.vykonKw}>
              <input type="number" className={input} value={auto.vykon} onChange={(e) => setAuto({ ...auto, vykon: e.target.value })} placeholder="kW" />
            </Pole>
          </div>
          <button type="button" onClick={() => setChatZacat(true)} disabled={!autoVyplneno} className={`mt-4 ${btnPrimary}`}>
            {t.zacniChat}
          </button>
        </Sekce>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">{t.aiMechanikNadpis}</h1>
        <button type="button" onClick={novyAuto} className={btnGhost}>{t.novyAutoDoChatu}</button>
      </div>

      <Sekce titulek={`${auto.znacka} ${auto.model} (${auto.rok}, ${auto.motor}, ${auto.vykon} kW)`}>
        <div className="space-y-3">
          {zpravy.map((z, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${
                z.role === "user" ? "bg-panel2 text-zinc-100" : "border border-border bg-panel2/40 text-zinc-200"
              }`}
            >
              <p className="mb-1 text-xs font-medium text-zinc-500">{z.role === "user" ? "" : t.mechAsistent}</p>
              <p className="whitespace-pre-wrap">{z.obsah}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className={input}
            value={vstup}
            onChange={(e) => setVstup(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !bezi) poslat(); }}
            placeholder={t.napisOtazku}
          />
          <button type="button" onClick={poslat} disabled={bezi || !vstup.trim()} className={btnGhost}>
            {t.odeslat}
          </button>
        </div>
        {chyba && <p className="mt-2 text-sm text-red-400">{chyba}</p>}
      </Sekce>
    </main>
  );
}
