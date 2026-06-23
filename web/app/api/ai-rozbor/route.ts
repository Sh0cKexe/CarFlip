import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AI_ROZBOR_LIMIT, zacatekMesice } from "@/lib/aiLimit";

const SYSTEM_PROMPT = `Jsi expert na ojetá auta a jejich dovoz/import za účelem dalšího prodeje (flip).
Dostaneš data jednoho inzerátu (z Otomoto.pl, Bazoš.cz, Bazoš.sk, AutoScout24 nebo Willhaben.at - JSON nebo prostý text podle zdroje). Napiš stručnou analýzu v ČEŠTINĚ, v tomto pořadí:

1. **Shrnutí auta** – model, rok, motor, nájezd, cena, stav v krátkosti.
2. **Typické známé problémy této motorizace/modelu** – z obecných znalostí o tomto autě (NE z textu inzerátu).
3. **Red flags z TOHOTO inzerátu** – podezřelé věci přímo z dat (poškození, neregistrováno, podezřele nízká cena/nájezd, nejasný popis, chybějící servisní historie apod.). Pokud nic podezřelého není, napiš to.
4. **Doporučení** – jedno slovo tučně: **KOUPIT** / **NEKOUPIT** / **ZJISTIT VÍC**, a 1-2 věty proč.

Buď stručný a konkrétní, žádné obecné fráze.`;

const HEADERS = { "User-Agent": "Mozilla/5.0 (CarFlip AI rozbor)" };

type Zdroj = "otomoto" | "autoscout24" | "willhaben" | "bazos";

function detekujZdroj(url: string): Zdroj | null {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (host.endsWith("otomoto.pl")) return "otomoto";
  if (host.includes("autoscout24.")) return "autoscout24";
  if (host.endsWith("willhaben.at")) return "willhaben";
  if (host.endsWith("bazos.cz") || host.endsWith("bazos.sk")) return "bazos";
  return null;
}

function vytahniNextData(html: string): any | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/** Otomoto.pl - JSON v __NEXT_DATA__.
 * POZOR: advert.images ma ~24000 znaku a je v objektu PRED description/
 * details/parametersDict (zive overeno) - kdyby se posilal cely advert,
 * slice(12000) by skoro vzdy usekl specifikace a poslal jen rozfoceny
 * seznam URL fotek. Proto vyber jen relevantnich poli. */
async function dataZOtomoto(url: string): Promise<{ obsah: string } | { chyba: string }> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `Otomoto vrátilo chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();
  const data = vytahniNextData(html);
  const advert = data?.props?.pageProps?.advert;
  if (!advert) return { chyba: "Z inzerátu se nepodařilo vytáhnout data (Otomoto možná změnilo formát stránky)." };
  const vyber = {
    title: advert.title,
    price: advert.price,
    description: advert.description,
    details: advert.details,
    parametersDict: advert.parametersDict,
    equipment: advert.equipment,
    category: advert.category,
  };
  return { obsah: JSON.stringify(vyber).slice(0, 12000) };
}

/** AutoScout24 (DE/AT/IT...) - JSON v __NEXT_DATA__, listingDetails.
 * POZOR: listingDetails ma i pole "financingAndInsurance" s ~56000 znaky
 * (zive overeno) - kdyby se posilalo cele, slice(12000) by usekl presne
 * uprostred pole "vehicle" (motor/najezd/palivo). Proto se posila jen
 * vyber relevantnich poli, ne cely objekt. */
async function dataZAutoscout24(url: string): Promise<{ obsah: string } | { chyba: string }> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `AutoScout24 vrátilo chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();
  const data = vytahniNextData(html);
  const detail = data?.props?.pageProps?.listingDetails;
  if (!detail) return { chyba: "Z inzerátu se nepodařilo vytáhnout data (AutoScout24 možná změnilo formát stránky)." };
  const vyber = {
    description: detail.description,
    vehicle: detail.vehicle,
    price: detail.price,
    location: detail.location,
    ratings: detail.ratings,
    warranty: detail.warranty,
  };
  return { obsah: JSON.stringify(vyber).slice(0, 12000) };
}

/** Willhaben.at - JSON v __NEXT_DATA__, attribute-list format. */
async function dataZWillhaben(url: string): Promise<{ obsah: string } | { chyba: string }> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `Willhaben vrátilo chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();
  const data = vytahniNextData(html);
  const attrs = data?.props?.pageProps?.advertDetails?.attributes?.attribute;
  if (!attrs) return { chyba: "Z inzerátu se nepodařilo vytáhnout data (Willhaben možná změnilo formát stránky)." };
  const obj: Record<string, string> = {};
  for (const a of attrs) {
    if (a?.name && a?.values?.[0] != null) obj[a.name] = String(a.values[0]);
  }
  return { obsah: JSON.stringify(obj).slice(0, 12000) };
}

/** Bazoš.cz/sk - zadny JSON, jen HTML. Vytahne blok div.popisdetail (strukturovane
 * udaje + volny popis) hrubou silou (bez DOM parseru - jen najde znacku a useka
 * dalsi rozumny kus HTML, pak ho ocisti od tagu). */
async function dataZBazos(url: string): Promise<{ obsah: string } | { chyba: string }> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `Bazoš vrátil chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const cenaMatch = html.match(/class="inzeratycena"[^>]*>([\s\S]*?)<\/div>/);
  const cenaText = cenaMatch ? cenaMatch[1].replace(/<[^>]+>/g, "").trim() : null;
  const popisRegex = /class=["']?popisdetail["']?/i;
  const popisM = popisRegex.exec(html);
  if (!popisM) {
    return { chyba: "Z inzerátu se nepodařilo vytáhnout popis (Bazoš možná změnil formát stránky)." };
  }
  const popisIdx = popisM.index;
  let blok = html.slice(popisIdx, popisIdx + 6000);
  blok = blok.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ");
  blok = blok.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  blok = blok.replace(/[ \t]+/g, " ").trim();

  const obsah = [
    titleMatch ? `Název: ${titleMatch[1].trim()}` : "",
    cenaText ? `Cena: ${cenaText}` : "",
    "Detail:",
    blok,
  ].filter(Boolean).join("\n");
  return { obsah: obsah.slice(0, 8000) };
}

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = body.url;
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "Vyplň link na inzerát." }, { status: 400 });
  }
  const zdroj = detekujZdroj(url);
  if (!zdroj) {
    return NextResponse.json(
      { error: "Podporované jsou jen Otomoto, Bazoš.cz, Bazoš.sk, AutoScout24 a Willhaben." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Musíš být přihlášen." }, { status: 401 });
  }

  const { count } = await supabase
    .from("ai_rozbory")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("vytvoreno", zacatekMesice());

  if (count !== null && count >= AI_ROZBOR_LIMIT) {
    return NextResponse.json(
      { error: `Dosáhl jsi měsíčního limitu AI rozborů (${AI_ROZBOR_LIMIT}/měsíc). Limit se obnoví příští měsíc.` },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI rozbor není nastaven (chybí ANTHROPIC_API_KEY na serveru)." },
      { status: 500 }
    );
  }

  let vysledekFetch: { obsah: string } | { chyba: string };
  try {
    if (zdroj === "otomoto") vysledekFetch = await dataZOtomoto(url);
    else if (zdroj === "autoscout24") vysledekFetch = await dataZAutoscout24(url);
    else if (zdroj === "willhaben") vysledekFetch = await dataZWillhaben(url);
    else vysledekFetch = await dataZBazos(url);
  } catch {
    return NextResponse.json({ error: "Nepodařilo se stáhnout inzerát." }, { status: 502 });
  }
  if ("chyba" in vysledekFetch) {
    return NextResponse.json({ error: vysledekFetch.chyba }, { status: 502 });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: vysledekFetch.obsah }],
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "";

    const { data: radek } = await supabase
      .from("ai_rozbory")
      .insert({ user_id: user.id, url, vysledek: text })
      .select("*")
      .single();

    return NextResponse.json({ text, radek, vyuzito: (count ?? 0) + 1, limit: AI_ROZBOR_LIMIT });
  } catch (e: any) {
    return NextResponse.json({ error: "Chyba AI rozboru: " + (e?.message || String(e)) }, { status: 502 });
  }
}
