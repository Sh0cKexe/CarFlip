import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AI_ROZBOR_LIMIT, zacatekMesice } from "@/lib/aiLimit";

const SYSTEM_PROMPT = `Jsi expert na ojetá auta a jejich dovoz z Polska do ČR za účelem dalšího prodeje (flip).
Dostaneš strukturovaná data jednoho inzerátu z Otomoto.pl (JSON). Napiš stručnou analýzu v ČEŠTINĚ, v tomto pořadí:

1. **Shrnutí auta** – model, rok, motor, nájezd, cena, stav v krátkosti.
2. **Typické známé problémy této motorizace/modelu** – z obecných znalostí o tomto autě (NE z textu inzerátu).
3. **Red flags z TOHOTO inzerátu** – podezřelé věci přímo z dat (poškození, neregistrováno, podezřele nízká cena/nájezd, nejasný popis, chybějící servisní historie apod.). Pokud nic podezřelého není, napiš to.
4. **Doporučení** – jedno slovo tučně: **KOUPIT** / **NEKOUPIT** / **ZJISTIT VÍC**, a 1-2 věty proč.

Buď stručný a konkrétní, žádné obecné fráze.`;

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = body.url;
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  if (!url || !url.startsWith("https://www.otomoto.pl/")) {
    return NextResponse.json({ error: "Vyplň platný link na Otomoto inzerát." }, { status: 400 });
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

  let html: string;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (CarFlip AI rozbor)" },
    });
    if (!r.ok) {
      return NextResponse.json(
        { error: `Otomoto vrátilo chybu (${r.status}) – inzerát možná byl smazán.` },
        { status: 502 }
      );
    }
    html = await r.text();
  } catch {
    return NextResponse.json({ error: "Nepodařilo se stáhnout inzerát z Otomoto." }, { status: 502 });
  }

  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    return NextResponse.json(
      { error: "Z inzerátu se nepodařilo vytáhnout data (Otomoto možná změnilo formát stránky)." },
      { status: 502 }
    );
  }

  let advert: unknown;
  try {
    const data = JSON.parse(match[1]);
    advert = data?.props?.pageProps?.advert;
  } catch {
    return NextResponse.json({ error: "Data inzerátu se nepodařilo zpracovat." }, { status: 502 });
  }
  if (!advert) {
    return NextResponse.json({ error: "Inzerát neobsahuje očekávaná data." }, { status: 502 });
  }

  const advertJson = JSON.stringify(advert).slice(0, 12000);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 800,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: advertJson }],
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
