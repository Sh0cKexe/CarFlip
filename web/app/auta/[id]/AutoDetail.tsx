"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Nav from "@/app/components/Nav";
import { Sekce, Pole, input } from "@/app/components/FormUI";

type Auto = {
  id: string;
  titulek: string;
  otomoto_url: string;
  stav: string;
  cena_koupeno_kc: number | null;
  cena_prodano_kc: number | null;
  poznamky: string;
  fotky: string[];
};
type Naklad = { id: string; auto_id: string; popis: string; castka_kc: number; datum: string };

export default function AutoDetail({
  email, userId, auto: autoVychozi, naklady: nakladyVychozi,
}: { email: string; userId: string; auto: Auto; naklady: Naklad[] }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [auto, setAuto] = useState<Auto>(autoVychozi);
  const [naklady, setNaklady] = useState<Naklad[]>(nakladyVychozi);
  const [novyNaklad, setNovyNaklad] = useState({ popis: "", castka_kc: "" });
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({});
  const [uklada, setUklada] = useState(false);
  const [nahravam, setNahravam] = useState(false);
  const [zprava, setZprava] = useState<string | null>(null);

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
        poznamky: auto.poznamky,
      })
      .eq("id", auto.id);
    setUklada(false);
    setZprava(error ? "Chyba při ukládání: " + error.message : "Uloženo.");
  }

  async function smazatAuto() {
    if (!confirm("Smazat tohle auto i se všemi náklady a fotkami?")) return;
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

  async function smazatFotku(cesta: string) {
    await supabase.storage.from("auta-fotky").remove([cesta]);
    const fotky = auto.fotky.filter((f) => f !== cesta);
    await supabase.from("auta").update({ fotky }).eq("id", auto.id);
    setAuto({ ...auto, fotky });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Nav email={email} />

      <div className="mb-6 flex items-center justify-between">
        <a href="/auta" className="text-sm text-zinc-400 hover:text-zinc-200">← Zpět na moje auta</a>
        <button onClick={smazatAuto} className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">
          Smazat auto
        </button>
      </div>

      <Sekce titulek="Základní info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Pole label="Název / model">
            <input className={input} value={auto.titulek} onChange={(e) => setPole("titulek", e.target.value)} />
          </Pole>
          <Pole label="Stav">
            <select className={input} value={auto.stav} onChange={(e) => setPole("stav", e.target.value)}>
              <option value="koupeno">koupeno</option>
              <option value="inzerce">v inzerci</option>
              <option value="prodano">prodáno</option>
            </select>
          </Pole>
        </div>
        <div className="mt-4">
          <Pole label="Link na Otomoto inzerát">
            <input className={input} value={auto.otomoto_url} onChange={(e) => setPole("otomoto_url", e.target.value)} />
          </Pole>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Pole label="Cena koupeno (Kč)">
            <input
              type="number" className={input} value={auto.cena_koupeno_kc ?? ""}
              onChange={(e) => setPole("cena_koupeno_kc", e.target.value ? Number(e.target.value) : null)}
            />
          </Pole>
          <Pole label="Cena prodáno (Kč)">
            <input
              type="number" className={input} value={auto.cena_prodano_kc ?? ""}
              onChange={(e) => setPole("cena_prodano_kc", e.target.value ? Number(e.target.value) : null)}
            />
          </Pole>
        </div>
        <div className="mt-4">
          <Pole label="Poznámky">
            <textarea
              className={input + " min-h-[100px]"} value={auto.poznamky}
              onChange={(e) => setPole("poznamky", e.target.value)}
            />
          </Pole>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={ulozit} disabled={uklada}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {uklada ? "Ukládám..." : "Uložit"}
          </button>
          {zprava && <p className={`text-sm ${zprava.startsWith("Chyba") ? "text-red-400" : "text-emerald-400"}`}>{zprava}</p>}
        </div>
      </Sekce>

      <Sekce
        titulek="Náklady"
        badge={{ text: `${sumaNakladu.toLocaleString("cs-CZ")} Kč celkem`, tone: "zinc" }}
      >
        <div className="space-y-2">
          {naklady.map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded-lg border border-border bg-panel2 px-4 py-2">
              <span className="text-sm text-zinc-200">{n.popis}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">{n.castka_kc.toLocaleString("cs-CZ")} Kč</span>
                <button onClick={() => smazatNaklad(n.id)} className="text-xs text-red-400 hover:underline">smazat</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <Pole label="Popis (např. Dovoz, STK, pojistka)">
            <input className={input} value={novyNaklad.popis} onChange={(e) => setNovyNaklad({ ...novyNaklad, popis: e.target.value })} />
          </Pole>
          <Pole label="Částka (Kč)">
            <input
              type="number" className={input} value={novyNaklad.castka_kc}
              onChange={(e) => setNovyNaklad({ ...novyNaklad, castka_kc: e.target.value })}
            />
          </Pole>
          <button onClick={pridatNaklad} className="h-fit rounded-lg border border-accent2 px-4 py-2 text-sm text-accent2 hover:bg-accent2/10">
            + Přidat
          </button>
        </div>
        {zisk != null && (
          <p className={`mt-4 text-sm font-medium ${zisk >= 0 ? "text-accent" : "text-red-400"}`}>
            Čistý zisk: {zisk.toLocaleString("cs-CZ")} Kč
          </p>
        )}
      </Sekce>

      <Sekce titulek="Fotky">
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
        <input ref={fileInput} type="file" accept="image/*" multiple onChange={(e) => nahratFotky(e.target.files)} disabled={nahravam} className="text-sm text-zinc-400" />
        {nahravam && <p className="mt-2 text-sm text-zinc-500">Nahrávám...</p>}
      </Sekce>
    </main>
  );
}
