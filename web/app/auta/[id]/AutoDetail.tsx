"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/app/components/Sidebar";
import { Sekce, Pole, input } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

type Auto = {
  id: string;
  titulek: string;
  otomoto_url: string;
  stav: string;
  cena_koupeno_kc: number | null;
  cena_prodano_kc: number | null;
  datum_koupeno: string | null;
  datum_prodano: string | null;
  poznamky: string;
  fotky: string[];
};
type Naklad = { id: string; auto_id: string; popis: string; castka_kc: number; datum: string };

export default function AutoDetail({
  email, userId, auto: autoVychozi, naklady: nakladyVychozi, trh,
}: { email: string; userId: string; auto: Auto; naklady: Naklad[]; trh: Trh }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const t = T(trh);

  const [auto, setAuto] = useState<Auto>(autoVychozi);
  const [naklady, setNaklady] = useState<Naklad[]>(nakladyVychozi);
  const [novyNaklad, setNovyNaklad] = useState({ popis: "", castka_kc: "" });
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({});
  const [uklada, setUklada] = useState(false);
  const [nahravam, setNahravam] = useState(false);
  const [zprava, setZprava] = useState<string | null>(null);
  const [aiRozbor, setAiRozbor] = useState<string | null>(null);
  const [aiBezi, setAiBezi] = useState(false);
  const [aiChyba, setAiChyba] = useState<string | null>(null);

  const sumaNakladu = naklady.reduce((s, n) => s + (n.castka_kc || 0), 0);
  const zisk =
    auto.stav === "prodano" && auto.cena_koupeno_kc != null && auto.cena_prodano_kc != null
      ? auto.cena_prodano_kc - auto.cena_koupeno_kc - sumaNakladu
      : null;

  useEffect(() => {
    if (auto.fotky.length === 0) return;
    supabase.storage.from("auta-fotky").createSignedUrls(auto.fotky, 3600).then(({ data }) => {
      const mapa: Record<string, string> = {};
      (data ?? []).forEach((d) => {
        if (d.signedUrl && d.path) mapa[d.path] = d.signedUrl;
      });
      setFotoUrls(mapa);
    });
  }, [auto.fotky, supabase]);

  function setPole<K extends keyof Auto>(klic: K, hodnota: Auto[K]) {
    setAuto({ ...auto, [klic]: hodnota });
  }

  async function ulozit() {
    setUklada(true);
    setZprava(null);
    const { error } = await supabase
      .from("auta")
      .update({
        titulek: auto.titulek,
        otomoto_url: auto.otomoto_url,
        stav: auto.stav,
        cena_koupeno_kc: auto.cena_koupeno_kc,
        cena_prodano_kc: auto.cena_prodano_kc,
        datum_koupeno: auto.datum_koupeno,
        datum_prodano: auto.datum_prodano,
        poznamky: auto.poznamky,
      })
      .eq("id", auto.id);
    setUklada(false);
    setZprava(error ? t.chybaUkladani + error.message : t.ulozeno);
  }

  async function smazatAuto() {
    if (!confirm(t.potvrditSmazani)) return;
    if (auto.fotky.length > 0) await supabase.storage.from("auta-fotky").remove(auto.fotky);
    await supabase.from("auta").delete().eq("id", auto.id);
    router.push("/auta");
  }

  async function pridatNaklad() {
    const castka = Number(novyNaklad.castka_kc);
    if (!novyNaklad.popis || !castka) return;
    const { data, error } = await supabase
      .from("naklady")
      .insert({ auto_id: auto.id, user_id: userId, popis: novyNaklad.popis, castka_kc: castka })
      .select("*")
      .single();
    if (!error && data) {
      setNaklady([data as Naklad, ...naklady]);
      setNovyNaklad({ popis: "", castka_kc: "" });
    }
  }

  async function smazatNaklad(id: string) {
    await supabase.from("naklady").delete().eq("id", id);
    setNaklady(naklady.filter((n) => n.id !== id));
  }

  async function nahratFotky(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNahravam(true);
    const noveCesty: string[] = [];
    for (const file of Array.from(files)) {
      const cesta = `${userId}/${auto.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("auta-fotky").upload(cesta, file);
      if (!error) noveCesty.push(cesta);
    }
    const fotky = [...auto.fotky, ...noveCesty];
    await supabase.from("auta").update({ fotky }).eq("id", auto.id);
    setAuto({ ...auto, fotky });
    setNahravam(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function spustitAiRozbor() {
    setAiBezi(true);
    setAiChyba(null);
    setAiRozbor(null);
    try {
      const r = await fetch("/api/ai-rozbor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auto.otomoto_url }),
      });
      const j = await r.json();
      if (!r.ok) setAiChyba(j.error || t.neznama);
      else setAiRozbor(j.text);
    } catch (e: any) {
      setAiChyba(t.chybaSite + e.message);
    } finally {
      setAiBezi(false);
    }
  }

  function pridatRozborDoPoznamek() {
    if (!aiRozbor) return;
    setPole("poznamky", (auto.poznamky ? auto.poznamky + "\n\n" : "") + "--- AI rozbor ---\n" + aiRozbor);
    setAiRozbor(null);
  }

  async function smazatFotku(cesta: string) {
    await supabase.storage.from("auta-fotky").remove([cesta]);
    const fotky = auto.fotky.filter((f) => f !== cesta);
    await supabase.from("auta").update({ fotky }).eq("id", auto.id);
    setAuto({ ...auto, fotky });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} trh={trh} userId={userId} />
      <main className="flex-1 px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <a href="/auta" className="text-sm text-zinc-400 hover:text-zinc-200">{t.zpetNaAuta}</a>
        <button onClick={smazatAuto} className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">
          {t.smazatAuto}
        </button>
      </div>

      <Sekce titulek={t.zakladniInfo}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Pole label={t.nazevModel}>
            <input className={input} value={auto.titulek} onChange={(e) => setPole("titulek", e.target.value)} />
          </Pole>
          <Pole label={t.stav}>
            <select className={input} value={auto.stav} onChange={(e) => setPole("stav", e.target.value)}>
              <option value="koupeno">{t.koupeno}</option>
              <option value="inzerce">{t.vInzerci}</option>
              <option value="prodano">{t.prodano}</option>
            </select>
          </Pole>
        </div>
        <div className="mt-4">
          <Pole label={t.linkOtomoto}>
            <input className={input} value={auto.otomoto_url} onChange={(e) => setPole("otomoto_url", e.target.value)} />
          </Pole>
          <button
            type="button" onClick={spustitAiRozbor} disabled={aiBezi || !auto.otomoto_url}
            className="mt-2 rounded-lg border border-accent2 px-4 py-2 text-sm text-accent2 transition hover:bg-accent2/10 disabled:opacity-40"
          >
            {aiBezi ? t.analyzuji : t.aiRozbor}
          </button>
          {aiChyba && <p className="mt-2 text-sm text-red-400">{aiChyba}</p>}
          {aiRozbor && (
            <div className="mt-3 rounded-lg border border-border bg-panel2 p-4">
              <p className="whitespace-pre-wrap text-sm text-zinc-200">{aiRozbor}</p>
              <button
                type="button" onClick={pridatRozborDoPoznamek}
                className="mt-3 rounded-lg border border-accent px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
              >
                {t.pridatDoPoznamek}
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Pole label={`${t.cenaKoupeno} (${t.mena})`}>
            <input
              type="number" className={input} value={auto.cena_koupeno_kc ?? ""}
              onChange={(e) => setPole("cena_koupeno_kc", e.target.value ? Number(e.target.value) : null)}
            />
          </Pole>
          <Pole label={`${t.cenaProdano} (${t.mena})`}>
            <input
              type="number" className={input} value={auto.cena_prodano_kc ?? ""}
              onChange={(e) => setPole("cena_prodano_kc", e.target.value ? Number(e.target.value) : null)}
            />
          </Pole>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Pole label={t.datumKoupeno}>
            <input
              type="date" className={input} value={auto.datum_koupeno ?? ""}
              onChange={(e) => setPole("datum_koupeno", e.target.value || null)}
            />
          </Pole>
          <Pole label={t.datumProdano}>
            <input
              type="date" className={input} value={auto.datum_prodano ?? ""}
              onChange={(e) => setPole("datum_prodano", e.target.value || null)}
            />
          </Pole>
        </div>
        <div className="mt-4">
          <Pole label={t.poznamky}>
            <textarea
              className={input + " min-h-[100px]"} value={auto.poznamky}
              onChange={(e) => setPole("poznamky", e.target.value)}
            />
          </Pole>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={ulozit} disabled={uklada}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {uklada ? t.ukladam : t.ulozit}
          </button>
          {zprava && <p className={`text-sm ${zprava.startsWith("Chyb") ? "text-red-400" : "text-accent"}`}>{zprava}</p>}
        </div>
      </Sekce>

      <Sekce
        titulek={t.naklady}
        badge={{ text: `${sumaNakladu.toLocaleString("cs-CZ")} ${t.mena} ${t.celkem}`, tone: "zinc" }}
      >
        <div className="space-y-2">
          {naklady.map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded-lg border border-border bg-panel2 px-4 py-2">
              <span className="text-sm text-zinc-200">{n.popis}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">{n.castka_kc.toLocaleString("cs-CZ")} {t.mena}</span>
                <button onClick={() => smazatNaklad(n.id)} className="text-xs text-red-400 hover:underline">{t.smazatMale}</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <Pole label={t.popisNakladu}>
            <input className={input} value={novyNaklad.popis} onChange={(e) => setNovyNaklad({ ...novyNaklad, popis: e.target.value })} />
          </Pole>
          <Pole label={`${t.castka} (${t.mena})`}>
            <input
              type="number" className={input} value={novyNaklad.castka_kc}
              onChange={(e) => setNovyNaklad({ ...novyNaklad, castka_kc: e.target.value })}
            />
          </Pole>
          <button onClick={pridatNaklad} className="h-fit rounded-lg border border-accent2 px-4 py-2 text-sm text-accent2 hover:bg-accent2/10">
            {t.pridat}
          </button>
        </div>
        {zisk != null && (
          <p className={`mt-4 text-sm font-medium ${zisk >= 0 ? "text-accent" : "text-red-400"}`}>
            {t.cistyZisk} {zisk.toLocaleString("cs-CZ")} {t.mena}
          </p>
        )}
      </Sekce>

      <Sekce titulek={t.fotky}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {auto.fotky.map((cesta) => (
            <div key={cesta} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-panel2">
              {fotoUrls[cesta] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrls[cesta]} alt="" className="h-full w-full object-cover" />
              )}
              <button
                onClick={() => smazatFotku(cesta)}
                className="absolute right-1 top-1 hidden rounded bg-black/70 px-1.5 py-0.5 text-xs text-white group-hover:block"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple onChange={(e) => nahratFotky(e.target.files)} disabled={nahravam} className="text-sm text-zinc-500" />
        {nahravam && <p className="mt-2 text-sm text-zinc-500">{t.nahravam}</p>}
      </Sekce>
      </main>
    </div>
  );
}
