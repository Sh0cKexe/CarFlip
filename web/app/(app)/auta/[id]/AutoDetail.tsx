"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Sekce, Pole, input, btnPrimary, btnGhost, btnDanger } from "@/app/components/FormUI";
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
type Naklad = { id: string; auto_id: string; popis: string; castka_kc: number; datum: string; kategorie: string };

function kc(n: number, mena: string): string {
  return `${n.toLocaleString("cs-CZ")} ${mena}`;
}

function dnesIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AutoDetail({
  userId, auto: autoVychozi, naklady: nakladyVychozi, trh,
}: { userId: string; auto: Auto; naklady: Naklad[]; trh: Trh }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const t = T(trh);

  const KATEGORIE = [
    { value: "dily", label: t.katDily },
    { value: "palivo", label: t.katPalivo },
    { value: "stk", label: t.katStk },
    { value: "pojisteni", label: t.katPojisteni },
    { value: "ostatni", label: t.katOstatni },
  ];

  const [auto, setAuto] = useState<Auto>(autoVychozi);
  const [naklady, setNaklady] = useState<Naklad[]>(nakladyVychozi);
  const [novyNaklad, setNovyNaklad] = useState({ popis: "", castka_kc: "", kategorie: "ostatni" });
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({});
  const [uklada, setUklada] = useState(false);
  const [nahravam, setNahravam] = useState(false);
  const [zprava, setZprava] = useState<string | null>(null);
  const [prodejOtevren, setProdejOtevren] = useState(false);
  const [prodejCena, setProdejCena] = useState("");
  const [prodejDatum, setProdejDatum] = useState(dnesIso());
  const [prodavam, setProdavam] = useState(false);

  const sumaNakladu = naklady.reduce((s, n) => s + (n.castka_kc || 0), 0);
  const celkemVAute = (auto.cena_koupeno_kc ?? 0) + sumaNakladu;
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
        stav: auto.stav,
        cena_koupeno_kc: auto.cena_koupeno_kc,
        datum_koupeno: auto.datum_koupeno,
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

  async function potvrditProdej() {
    const cena = Number(prodejCena);
    if (!cena) return;
    setProdavam(true);
    const { error } = await supabase
      .from("auta")
      .update({ stav: "prodano", cena_prodano_kc: cena, datum_prodano: prodejDatum })
      .eq("id", auto.id);
    setProdavam(false);
    if (!error) {
      setAuto({ ...auto, stav: "prodano", cena_prodano_kc: cena, datum_prodano: prodejDatum });
      setProdejOtevren(false);
    }
  }

  async function zrusitProdej() {
    await supabase.from("auta").update({ stav: "koupeno" }).eq("id", auto.id);
    setAuto({ ...auto, stav: "koupeno" });
  }

  async function pridatNaklad() {
    const castka = Number(novyNaklad.castka_kc);
    if (!novyNaklad.popis || !castka) return;
    const { data, error } = await supabase
      .from("naklady")
      .insert({
        auto_id: auto.id, user_id: userId, popis: novyNaklad.popis,
        castka_kc: castka, kategorie: novyNaklad.kategorie,
      })
      .select("*")
      .single();
    if (!error && data) {
      setNaklady([data as Naklad, ...naklady]);
      setNovyNaklad({ popis: "", castka_kc: "", kategorie: "ostatni" });
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

  async function smazatFotku(cesta: string) {
    await supabase.storage.from("auta-fotky").remove([cesta]);
    const fotky = auto.fotky.filter((f) => f !== cesta);
    await supabase.from("auta").update({ fotky }).eq("id", auto.id);
    setAuto({ ...auto, fotky });
  }

  return (
    <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center justify-between"
      >
        <a href="/auta" className="text-sm text-zinc-400 transition hover:text-zinc-200">{t.zpetNaAuta}</a>
        <div className="flex items-center gap-3">
          {auto.stav === "prodano" ? (
            <button onClick={zrusitProdej} className={btnGhost}>{t.zrusitProdej}</button>
          ) : (
            <button onClick={() => setProdejOtevren(true)} className={btnPrimary}>{t.prodatAuto}</button>
          )}
          <button onClick={smazatAuto} className={btnDanger}>{t.smazatAuto}</button>
        </div>
      </motion.div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatKarta label={t.porizeni} hodnota={kc(auto.cena_koupeno_kc ?? 0, t.mena)} />
        <StatKarta label={t.naklady} hodnota={kc(sumaNakladu, t.mena)} />
        <StatKarta label={t.celkemVAute} hodnota={kc(celkemVAute, t.mena)} zvyrazneno />
        <StatKarta
          label={t.ziskZtrata}
          hodnota={zisk != null ? kc(zisk, t.mena) : "—"}
          tone={zisk == null ? "neutral" : zisk >= 0 ? "green" : "red"}
        />
      </div>
      {auto.stav === "prodano" && auto.datum_prodano && (
        <p className="mb-6 -mt-3 text-sm text-zinc-400">
          {t.prodanoZa} {kc(auto.cena_prodano_kc ?? 0, t.mena)} · {new Date(auto.datum_prodano).toLocaleDateString("cs-CZ")}
        </p>
      )}

      <Sekce titulek={t.zakladniInfo}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Pole label={t.nazevModel}>
            <input className={input} value={auto.titulek} onChange={(e) => setPole("titulek", e.target.value)} />
          </Pole>
          <Pole label={t.stav}>
            <select
              className={input}
              value={auto.stav === "prodano" ? "koupeno" : auto.stav}
              onChange={(e) => setPole("stav", e.target.value)}
              disabled={auto.stav === "prodano"}
            >
              <option value="koupeno">{t.koupeno}</option>
              <option value="inzerce">{t.vInzerci}</option>
            </select>
          </Pole>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Pole label={`${t.cenaKoupeno} (${t.mena})`}>
            <input
              type="number" className={input} value={auto.cena_koupeno_kc ?? ""}
              onChange={(e) => setPole("cena_koupeno_kc", e.target.value ? Number(e.target.value) : null)}
            />
          </Pole>
          <Pole label={t.datumKoupeno}>
            <input
              type="date" className={input} value={auto.datum_koupeno ?? ""}
              onChange={(e) => setPole("datum_koupeno", e.target.value || null)}
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
          <button onClick={ulozit} disabled={uklada} className={btnPrimary}>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-200">{n.popis}</span>
                <span className="rounded-full bg-zinc-700/40 px-2 py-0.5 text-xs text-zinc-400">
                  {KATEGORIE.find((k) => k.value === n.kategorie)?.label ?? n.kategorie}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">{kc(n.castka_kc, t.mena)}</span>
                <button onClick={() => smazatNaklad(n.id)} className="text-xs text-red-400 hover:underline">{t.smazatMale}</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <Pole label={t.popisNakladu}>
            <input className={input} value={novyNaklad.popis} onChange={(e) => setNovyNaklad({ ...novyNaklad, popis: e.target.value })} />
          </Pole>
          <Pole label={t.kategorie}>
            <select
              className={input}
              value={novyNaklad.kategorie}
              onChange={(e) => setNovyNaklad({ ...novyNaklad, kategorie: e.target.value })}
            >
              {KATEGORIE.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </Pole>
          <Pole label={`${t.castka} (${t.mena})`}>
            <input
              type="number" className={input} value={novyNaklad.castka_kc}
              onChange={(e) => setNovyNaklad({ ...novyNaklad, castka_kc: e.target.value })}
            />
          </Pole>
          <button onClick={pridatNaklad} className={`h-fit ${btnGhost}`}>
            {t.pridat}
          </button>
        </div>
      </Sekce>

      <Sekce titulek={t.fotky}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {auto.fotky.map((cesta, i) => (
            <motion.div
              key={cesta}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              whileHover={{ scale: 1.03 }}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-panel2"
            >
              {fotoUrls[cesta] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrls[cesta]} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              )}
              <button
                onClick={() => smazatFotku(cesta)}
                className="absolute right-1 top-1 hidden rounded bg-black/70 px-1.5 py-0.5 text-xs text-white group-hover:block"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple onChange={(e) => nahratFotky(e.target.files)} disabled={nahravam} className="text-sm text-zinc-500" />
        {nahravam && <p className="mt-2 text-sm text-zinc-500">{t.nahravam}</p>}
      </Sekce>

      <AnimatePresence>
        {prodejOtevren && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setProdejOtevren(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-sm rounded-2xl border border-border p-6 shadow-glow-lg"
            >
              <h2 className="mb-4 text-base font-semibold text-zinc-100">{t.prodatAuto}</h2>
              <div className="space-y-4">
                <Pole label={`${t.prodejniCena} (${t.mena})`}>
                  <input
                    type="number" autoFocus className={input} value={prodejCena}
                    onChange={(e) => setProdejCena(e.target.value)}
                  />
                </Pole>
                <Pole label={t.datumProdeje}>
                  <input
                    type="date" className={input} value={prodejDatum}
                    onChange={(e) => setProdejDatum(e.target.value)}
                  />
                </Pole>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setProdejOtevren(false)} className={btnGhost}>{t.zrusit}</button>
                <button onClick={potvrditProdej} disabled={prodavam || !prodejCena} className={btnPrimary}>
                  {prodavam ? t.ukladam : t.oznacitProdano}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatKarta({
  label, hodnota, tone = "neutral", zvyrazneno = false,
}: { label: string; hodnota: string; tone?: "neutral" | "green" | "red"; zvyrazneno?: boolean }) {
  const toneClass = tone === "green" ? "text-accent" : tone === "red" ? "text-red-400" : "text-zinc-100";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`glass rounded-xl border p-4 ${zvyrazneno ? "border-accent2/40 shadow-glow-blue" : "border-border"}`}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneClass}`}>{hodnota}</p>
    </motion.div>
  );
}
