"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import KebabMenu, { KebabPolozka } from "@/app/components/KebabMenu";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Sekce, Pole, input, btnPrimary, btnGhost } from "@/app/components/FormUI";
import { T, type Trh } from "@/lib/i18n";

type Auto = {
  id: string;
  titulek: string;
  otomoto_url: string;
  stav: string;
  cena_koupeno_kc: number | null;
  cena_prodano_kc: number | null;
  datum_koupeno: string | null;
  datum_inzerce: string | null;
  datum_prodano: string | null;
  najezd_km: number | null;
  poznamky: string;
  fotky: string[];
};
type Naklad = { id: string; auto_id: string; popis: string; castka_kc: number; datum: string };
type Ukol = { id: string; auto_id: string; text: string; hotovo: boolean };

function kc(n: number, mena: string): string {
  return `${n.toLocaleString("cs-CZ")} ${mena}`;
}

function formatDatum(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ");
}

function dnesIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dobaProdejeDny(auto: Auto): number | null {
  if (!auto.datum_koupeno) return null;
  const od = new Date(auto.datum_koupeno).getTime();
  const dokdy = auto.datum_prodano ? new Date(auto.datum_prodano).getTime() : Date.now();
  return Math.max(0, Math.round((dokdy - od) / 86400000));
}

export default function AutoDetail({
  userId, auto: autoVychozi, naklady: nakladyVychozi, ukoly: ukolyVychozi, trh,
}: { userId: string; auto: Auto; naklady: Naklad[]; ukoly: Ukol[]; trh: Trh }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const t = T(trh);

  const [auto, setAuto] = useState<Auto>(autoVychozi);
  const [naklady, setNaklady] = useState<Naklad[]>(nakladyVychozi);
  const [novyNaklad, setNovyNaklad] = useState({ popis: "", castka_kc: "", datum: dnesIso() });
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({});
  const [uklada, setUklada] = useState(false);
  const [nahravam, setNahravam] = useState(false);
  const [zprava, setZprava] = useState<string | null>(null);
  const [editModalOtevren, setEditModalOtevren] = useState(false);
  const [prodejOtevren, setProdejOtevren] = useState(false);
  const [stavMenuOtevren, setStavMenuOtevren] = useState(false);
  const stavMenuRef = useRef<HTMLDivElement>(null);
  const [inzerceModalOtevren, setInzerceModalOtevren] = useState(false);
  const [inzerceDatum, setInzerceDatum] = useState(dnesIso());
  const [prodejCena, setProdejCena] = useState("");
  const [prodejDatum, setProdejDatum] = useState(dnesIso());
  const [prodavam, setProdavam] = useState(false);
  const [ukoly, setUkoly] = useState<Ukol[]>(ukolyVychozi);
  const [novyUkol, setNovyUkol] = useState("");
  const [ukolChyba, setUkolChyba] = useState<string | null>(null);
  const [fotoChyba, setFotoChyba] = useState<string | null>(null);
  const [nakladChyba, setNakladChyba] = useState<string | null>(null);
  const [upravujiNaklad, setUpravujiNaklad] = useState<string | null>(null);
  const [upravaNaklad, setUpravaNaklad] = useState({ popis: "", castka_kc: "", datum: "" });
  const [lightbox, setLightbox] = useState<number | null>(null);

  const zavritStavMenu = useCallback((e: MouseEvent) => {
    if (stavMenuRef.current && !stavMenuRef.current.contains(e.target as Node)) setStavMenuOtevren(false);
  }, []);
  useEffect(() => {
    if (!stavMenuOtevren) return;
    window.addEventListener("click", zavritStavMenu);
    return () => window.removeEventListener("click", zavritStavMenu);
  }, [stavMenuOtevren, zavritStavMenu]);

  useEffect(() => {
    if (lightbox === null) return;
    function naKlavesu(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % auto.fotky.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + auto.fotky.length) % auto.fotky.length));
    }
    window.addEventListener("keydown", naKlavesu);
    return () => window.removeEventListener("keydown", naKlavesu);
  }, [lightbox, auto.fotky.length]);

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

  async function zmenitStav(novaStav: "koupeno") {
    await supabase.from("auta").update({ stav: novaStav, datum_inzerce: null }).eq("id", auto.id);
    setAuto({ ...auto, stav: novaStav, datum_inzerce: null });
    setStavMenuOtevren(false);
  }

  async function potvrditInzerci() {
    await supabase.from("auta").update({ stav: "inzerce", datum_inzerce: inzerceDatum }).eq("id", auto.id);
    setAuto({ ...auto, stav: "inzerce", datum_inzerce: inzerceDatum });
    setInzerceModalOtevren(false);
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
        datum_inzerce: auto.datum_inzerce,
        najezd_km: auto.najezd_km,
        poznamky: auto.poznamky,
      })
      .eq("id", auto.id);
    setUklada(false);
    if (error) setZprava(t.chybaUkladani + error.message);
    else setEditModalOtevren(false);
  }

  async function ulozitPoznamky() {
    await supabase.from("auta").update({ poznamky: auto.poznamky }).eq("id", auto.id);
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
    await supabase
      .from("auta")
      .update({ stav: "koupeno", cena_prodano_kc: null, datum_prodano: null })
      .eq("id", auto.id);
    setAuto({ ...auto, stav: "koupeno", cena_prodano_kc: null, datum_prodano: null });
  }

  async function pridatNaklad() {
    const castka = Number(novyNaklad.castka_kc);
    if (!novyNaklad.popis || !castka) return;
    setNakladChyba(null);
    const { data, error } = await supabase
      .from("naklady")
      .insert({
        auto_id: auto.id, user_id: userId, popis: novyNaklad.popis,
        castka_kc: castka, datum: novyNaklad.datum,
      })
      .select("id, auto_id, popis, castka_kc, datum")
      .single();
    if (error) {
      setNakladChyba(error.message);
      return;
    }
    setNaklady([data as Naklad, ...naklady]);
    setNovyNaklad({ popis: "", castka_kc: "", datum: dnesIso() });
  }

  function zacniUpravovatNaklad(n: Naklad) {
    setUpravujiNaklad(n.id);
    setUpravaNaklad({ popis: n.popis, castka_kc: String(n.castka_kc), datum: n.datum });
  }

  async function ulozitNaklad() {
    if (!upravujiNaklad) return;
    const castka = Number(upravaNaklad.castka_kc);
    if (!upravaNaklad.popis || !castka) return;
    setNakladChyba(null);
    const { error } = await supabase
      .from("naklady")
      .update({ popis: upravaNaklad.popis, castka_kc: castka, datum: upravaNaklad.datum })
      .eq("id", upravujiNaklad);
    if (error) {
      setNakladChyba(error.message);
      return;
    }
    setNaklady(naklady.map((n) => (n.id === upravujiNaklad ? { ...n, ...upravaNaklad, castka_kc: castka } : n)));
    setUpravujiNaklad(null);
  }

  async function smazatNaklad(id: string) {
    setNakladChyba(null);
    const { error } = await supabase.from("naklady").delete().eq("id", id);
    if (error) {
      setNakladChyba(error.message);
      return;
    }
    setNaklady(naklady.filter((n) => n.id !== id));
  }

  async function pridatUkol() {
    if (!novyUkol.trim()) return;
    setUkolChyba(null);
    const { data, error } = await supabase
      .from("ukoly")
      .insert({ auto_id: auto.id, user_id: userId, text: novyUkol.trim() })
      .select("id, auto_id, text, hotovo")
      .single();
    if (error) {
      setUkolChyba(error.message);
      return;
    }
    setUkoly([...ukoly, data as Ukol]);
    setNovyUkol("");
  }

  async function prepnoutUkol(ukol: Ukol) {
    setUkolChyba(null);
    const hotovo = !ukol.hotovo;
    const { error } = await supabase.from("ukoly").update({ hotovo }).eq("id", ukol.id);
    if (error) {
      setUkolChyba(error.message);
      return;
    }
    setUkoly(ukoly.map((u) => (u.id === ukol.id ? { ...u, hotovo } : u)));
  }

  async function smazatUkol(id: string) {
    setUkolChyba(null);
    const { error } = await supabase.from("ukoly").delete().eq("id", id);
    if (error) {
      setUkolChyba(error.message);
      return;
    }
    setUkoly(ukoly.filter((u) => u.id !== id));
  }

  async function nahratFotky(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNahravam(true);
    setFotoChyba(null);
    const noveCesty: string[] = [];
    let prvniChyba: string | null = null;
    for (const file of Array.from(files)) {
      const cesta = `${userId}/${auto.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("auta-fotky").upload(cesta, file);
      if (!error) noveCesty.push(cesta);
      else if (!prvniChyba) prvniChyba = error.message;
    }
    if (prvniChyba) setFotoChyba(prvniChyba);
    if (noveCesty.length > 0) {
      const fotky = [...auto.fotky, ...noveCesty];
      await supabase.from("auta").update({ fotky }).eq("id", auto.id);
      setAuto({ ...auto, fotky });
    }
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
        className="mb-4 flex items-center justify-between"
      >
        <a href="/auta" className="text-sm text-zinc-300 transition hover:text-white">{t.zpetNaAuta}</a>
        <div className="flex items-center gap-3">
          {auto.stav === "prodano" ? (
            <button onClick={zrusitProdej} className={btnGhost}>{t.zrusitProdej}</button>
          ) : (
            <div ref={stavMenuRef} className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setStavMenuOtevren(!stavMenuOtevren); }}
                className={btnPrimary}
              >
                Změnit stav ▾
              </button>
              <AnimatePresence>
                {stavMenuOtevren && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="glass absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-border py-1 shadow-glow-lg"
                  >
                    {auto.stav === "koupeno" && (
                      <button
                        type="button"
                        onClick={() => { setStavMenuOtevren(false); setInzerceDatum(auto.datum_inzerce ?? dnesIso()); setInzerceModalOtevren(true); }}
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-sidebar2"
                      >
                        📢 V inzerci
                      </button>
                    )}
                    {auto.stav === "inzerce" && (
                      <button
                        type="button"
                        onClick={() => zmenitStav("koupeno")}
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-sidebar2"
                      >
                        🛒 Zpět ke koupenému
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setStavMenuOtevren(false); setProdejOtevren(true); }}
                      className="block w-full px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-sidebar2"
                    >
                      ✅ Prodat
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <KebabMenu>
            <KebabPolozka onClick={() => { setZprava(null); setEditModalOtevren(true); }}>{t.upravit}</KebabPolozka>
            <KebabPolozka onClick={smazatAuto} danger>{t.smazatAuto}</KebabPolozka>
          </KebabMenu>
        </div>
      </motion.div>

      <h1 className="mb-2 text-2xl font-semibold text-white">{auto.titulek || t.bezNazvu}</h1>
      <p className="mb-6 text-sm text-zinc-300">
        {t.datumKoupeno}: <span className="text-white">{formatDatum(auto.datum_koupeno)}</span>
        {auto.stav === "prodano" && auto.datum_prodano && (
          <>
            {" · "}{t.prodanoZa} <span className="text-white">{kc(auto.cena_prodano_kc ?? 0, t.mena)}</span>
            {" "}({formatDatum(auto.datum_prodano)})
          </>
        )}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatKarta label={t.porizeni} hodnota={kc(auto.cena_koupeno_kc ?? 0, t.mena)} />
        <StatKarta label={t.naklady} hodnota={kc(sumaNakladu, t.mena)} />
        <StatKarta label={t.celkemVAute} hodnota={kc(celkemVAute, t.mena)} zvyrazneno />
        <StatKarta
          label={t.ziskZtrata}
          hodnota={zisk != null ? kc(zisk, t.mena) : "—"}
          tone={zisk == null ? "neutral" : zisk >= 0 ? "green" : "red"}
        />
        <StatKarta
          label={t.dobaProdeje}
          hodnota={dobaProdejeDny(auto) != null ? `${dobaProdejeDny(auto)} ${t.dni}` : "—"}
        />
      </div>
      <div className="mb-6 border-t border-border/60" />


      <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
      <Sekce
        titulek={t.naklady}
        badge={{ text: `${sumaNakladu.toLocaleString("cs-CZ")} ${t.mena} ${t.celkem}`, tone: "zinc" }}
      >
        <div className="space-y-2">
          {naklady.map((n) =>
            upravujiNaklad === n.id ? (
              <div key={n.id} className="grid gap-2 rounded-lg border border-accent2/40 bg-panel2 p-3 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-end">
                <input
                  type="date" className={input} value={upravaNaklad.datum}
                  onChange={(e) => setUpravaNaklad({ ...upravaNaklad, datum: e.target.value })}
                />
                <input
                  className={input} value={upravaNaklad.popis}
                  onChange={(e) => setUpravaNaklad({ ...upravaNaklad, popis: e.target.value })}
                />
                <input
                  type="number" className={`${input} sm:w-28`} value={upravaNaklad.castka_kc}
                  onChange={(e) => setUpravaNaklad({ ...upravaNaklad, castka_kc: e.target.value })}
                />
                <button onClick={ulozitNaklad} className={btnPrimary}>{t.ulozit}</button>
                <button onClick={() => setUpravujiNaklad(null)} className={btnGhost}>{t.zrusit}</button>
              </div>
            ) : (
              <div key={n.id} className="flex items-center justify-between rounded-lg border border-border bg-panel2 px-4 py-2.5">
                <div className="flex items-center gap-4">
                  <span className="w-20 shrink-0 text-sm font-medium text-zinc-300">{formatDatum(n.datum)}</span>
                  <span className="text-sm text-zinc-100">{n.popis}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{kc(n.castka_kc, t.mena)}</span>
                  <KebabMenu>
                    <KebabPolozka onClick={() => zacniUpravovatNaklad(n)}>{t.upravit}</KebabPolozka>
                    <KebabPolozka onClick={() => smazatNaklad(n.id)} danger>{t.smazatMale}</KebabPolozka>
                  </KebabMenu>
                </div>
              </div>
            )
          )}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4 sm:items-end">
          <Pole label={t.popisNakladu}>
            <input className={input} value={novyNaklad.popis} onChange={(e) => setNovyNaklad({ ...novyNaklad, popis: e.target.value })} />
          </Pole>
          <Pole label={t.datum}>
            <input
              type="date" className={input} value={novyNaklad.datum}
              onChange={(e) => setNovyNaklad({ ...novyNaklad, datum: e.target.value })}
            />
          </Pole>
          <Pole label={`${t.castka} (${t.mena})`}>
            <input
              type="number" className={input} value={novyNaklad.castka_kc}
              onChange={(e) => setNovyNaklad({ ...novyNaklad, castka_kc: e.target.value })}
            />
          </Pole>
          <button onClick={pridatNaklad} className={btnGhost}>
            {t.pridat}
          </button>
        </div>
        {nakladChyba && <p className="mt-2 text-sm text-red-400">Chyba: {nakladChyba}</p>}
      </Sekce>
      </div>

      <div>
      <Sekce titulek={t.poznamky}>
        <textarea
          className={`${input} min-h-[180px]`}
          value={auto.poznamky}
          placeholder={t.poznamkyPlaceholder}
          onChange={(e) => setPole("poznamky", e.target.value)}
          onBlur={ulozitPoznamky}
        />
      </Sekce>
      </div>
      </div>

      <Sekce titulek={t.ukoly}>
        <div className="space-y-1.5">
          {ukoly.length === 0 && <p className="text-sm text-zinc-500">{t.zadneUkoly}</p>}
          {[...ukoly].sort((a, b) => Number(a.hotovo) - Number(b.hotovo)).map((u) => (
            <motion.div
              key={u.id}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.03]"
            >
              <button
                type="button"
                onClick={() => prepnoutUkol(u)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                  u.hotovo
                    ? "border-transparent bg-gradient-to-r from-accent to-accent2 text-white shadow-glow"
                    : "border-zinc-500 text-transparent hover:border-zinc-400"
                }`}
              >
                ✓
              </button>
              <span className={`flex-1 text-sm ${u.hotovo ? "text-zinc-300 line-through" : "text-zinc-100"}`}>
                {u.text}
              </span>
              <button
                onClick={() => smazatUkol(u.id)}
                className="text-xs text-red-400 opacity-0 transition hover:underline group-hover:opacity-100"
              >
                {t.smazatMale}
              </button>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <input
            className={input}
            placeholder={t.novyUkol}
            value={novyUkol}
            onChange={(e) => setNovyUkol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pridatUkol()}
          />
          <button onClick={pridatUkol} className={`h-fit ${btnGhost}`}>{t.pridat}</button>
        </div>
        {ukolChyba && <p className="mt-2 text-sm text-red-400">Chyba: {ukolChyba}</p>}
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
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border bg-panel2"
              onClick={() => setLightbox(i)}
            >
              {fotoUrls[cesta] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrls[cesta]} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); smazatFotku(cesta); }}
                className="absolute right-1 top-1 hidden rounded bg-black/70 px-1.5 py-0.5 text-xs text-white group-hover:block"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>
        <input
          ref={fileInput} type="file" accept="image/*" multiple
          onChange={(e) => nahratFotky(e.target.files)} className="hidden"
        />
        <button onClick={() => fileInput.current?.click()} disabled={nahravam} className={btnGhost}>
          {nahravam ? t.nahravam : t.pridatFotky}
        </button>
        {fotoChyba && <p className="mt-2 text-sm text-red-400">Chyba: {fotoChyba}</p>}
      </Sekce>

      <AnimatePresence>
        {lightbox !== null && auto.fotky[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
            >
              ✕
            </button>
            {auto.fotky.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? null : (i - 1 + auto.fotky.length) % auto.fotky.length)); }}
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? null : (i + 1) % auto.fotky.length)); }}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
                >
                  ›
                </button>
              </>
            )}
            {fotoUrls[auto.fotky[lightbox]] && (
              <motion.img
                key={auto.fotky[lightbox]}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                src={fotoUrls[auto.fotky[lightbox]]}
                alt=""
                onClick={(e) => e.stopPropagation()}
                className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
              />
            )}
            {auto.fotky.length > 1 && (
              <p className="absolute bottom-4 text-sm text-zinc-300">
                {lightbox + 1} / {auto.fotky.length}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inzerceModalOtevren && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setInzerceModalOtevren(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-sm rounded-2xl border border-border p-6 shadow-glow-lg"
            >
              <h2 className="mb-4 text-base font-semibold text-zinc-100">📢 V inzerci</h2>
              <Pole label={t.datumInzerce}>
                <input
                  autoFocus type="date" className={input} value={inzerceDatum}
                  onChange={(e) => setInzerceDatum(e.target.value)}
                />
              </Pole>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setInzerceModalOtevren(false)} className={btnGhost}>{t.zrusit}</button>
                <button onClick={potvrditInzerci} className={btnPrimary}>{t.ulozit}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editModalOtevren && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setEditModalOtevren(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md rounded-2xl border border-border p-6 shadow-glow-lg"
            >
              <h2 className="mb-4 text-base font-semibold text-zinc-100">{t.upravit}</h2>
              <div className="space-y-4">
                <Pole label={t.nazevModel}>
                  <input autoFocus className={input} value={auto.titulek} onChange={(e) => setPole("titulek", e.target.value)} />
                </Pole>
                <Pole label={t.datumKoupeno}>
                  <input
                    type="date" className={input} value={auto.datum_koupeno ?? ""}
                    onChange={(e) => setPole("datum_koupeno", e.target.value || null)}
                  />
                </Pole>
                <Pole label={`${t.cenaKoupeno} (${t.mena})`}>
                  <input
                    type="number" className={input} value={auto.cena_koupeno_kc ?? ""}
                    onChange={(e) => setPole("cena_koupeno_kc", e.target.value ? Number(e.target.value) : null)}
                  />
                </Pole>
                {zprava && <p className="text-sm text-red-400">{zprava}</p>}
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setEditModalOtevren(false)} className={btnGhost}>{t.zrusit}</button>
                <button onClick={ulozit} disabled={uklada} className={btnPrimary}>
                  {uklada ? t.ukladam : t.ulozit}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneClass}`}>{hodnota}</p>
    </motion.div>
  );
}
