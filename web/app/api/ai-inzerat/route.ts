import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AI_INZERAT_LIMIT, zacatekMesice } from "@/lib/aiLimit";

const SYSTEM_PROMPT = `Jsi expert na psaní inzerátů na prodej ojetých aut na bazar (Bazoš). Piš VÝHRADNĚ ČESKY NEBO SLOVENSKY podle jazyka v zadání, žádný jiný jazyk ani cizí znaky. Dodrž přesně tuto strukturu:

1. Na začátku technické specifikace, KAŽDÁ NA VLASTNÍ ŘÁDEK, ve formátu "Popisek - hodnota" (např. "Palivo - nafta"). Použij jen ty údaje, které dostaneš, vynech řádky bez hodnoty, nevymýšlej si nic. NIKDY nepiš cenu, cena je na Bazoši v samostatné kolonce a do textu inzerátu nepatří.
2. Prázdný řádek.
3. Pár krátkých odstavců normálním, věcným jazykem – k čemu se auto hodí, jaký je technický/karosériový stav, co bylo nedávno uděláno/vyměněno, jaká výbava je součástí, jestli auto potřebuje nějaké investice. Vychází z poznámek od majitele - fakta si nevymýšlej, ale klidně dej textu chytlavější/živější nádech (NE reklamní klišé), ať to zní zajímavě, ne suchopárně.

Styl: piš jako majitel popisující auto, NE jako prodejce oslovující kupujícího. Nikdy nepiš "vy/vám/hledáte/mohlo by vám vyhovovat" ani jiné přímé oslovení čtenáře, žádné řečnické otázky, žádná reklamní klišé ("Prodávám tuto raketu", přehnané nadšení). Emoji použij o trochu víc než jen symbolicky (klidně u každé specifikace i v textu), ale ne v každé druhé slovo - má to vypadat živě, ne jako spam.

Pokud dostaneš VIN, napiš ho jako poslední řádek specifikací ("VIN - ...").

Vrať jen samotný text inzerátu, žádný nadpis ani komentáře navíc.`;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  const { nazev, rok, najezd, palivo, prevodovka, vykon, spotreba, vin, poznamky, jazyk } = body;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Musíš být přihlášen." }, { status: 401 });
  }

  const { count } = await supabase
    .from("ai_inzeraty")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("vytvoreno", zacatekMesice());

  if (count !== null && count >= AI_INZERAT_LIMIT) {
    return NextResponse.json(
      { error: `Dosáhl jsi měsíčního limitu AI inzerátů (${AI_INZERAT_LIMIT}/měsíc). Limit se obnoví příští měsíc.` },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI generátor není nastaven (chybí ANTHROPIC_API_KEY na serveru)." },
      { status: 500 }
    );
  }

  const jazykText = jazyk === "sk" ? "slovensky" : "česky";
  const userPrompt = `Jazyk: ${jazykText}
Model: ${nazev || "neuvedeno"}
${vykon ? `Výkon: ${vykon} kW\n` : ""}Palivo: ${palivo || "neuvedeno"}
Nájezd: ${najezd ? najezd + " km" : "neuvedeno"}
Rok výroby: ${rok || "neuvedeno"}
${spotreba ? `Kombinovaná spotřeba: ${spotreba} l/100km\n` : ""}${vin ? `VIN: ${vin}\n` : ""}
Poznámky od majitele (stav, výbava, co bylo uděláno, důvod prodeje apod.): ${poznamky || "žádné"}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "";

    const { data: radek } = await supabase
      .from("ai_inzeraty")
      .insert({ user_id: user.id, nazev: nazev || "Bez názvu", vysledek: text })
      .select("*")
      .single();

    return NextResponse.json({ text, radek, vyuzito: (count ?? 0) + 1, limit: AI_INZERAT_LIMIT });
  } catch (e: any) {
    return NextResponse.json({ error: "Chyba AI: " + (e?.message || String(e)) }, { status: 502 });
  }
}
