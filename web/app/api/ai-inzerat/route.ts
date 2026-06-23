import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  const { nazev, rok, najezd, palivo, prevodovka, cena, mena, poznamky, jazyk } = body;
  if (!nazev) {
    return NextResponse.json({ error: "Vyplň název/model auta." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Musíš být přihlášen." }, { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "AI generátor není nastaven (chybí GROQ_API_KEY na serveru)." },
      { status: 500 }
    );
  }

  const jazykText = jazyk === "sk" ? "slovensky" : "česky";
  const systemPrompt = `Jsi expert na psaní inzerátů na prodej ojetých aut na bazar (Bazoš). Piš ${jazykText}, přirozeně, jako normální člověk – ŽÁDNÉ reklamní klišé typu "Prodávám tuto raketu" nebo přehnaně nadšený tón. Krátké věty, věcné a důvěryhodné, ale ať auto zní lákavě. Nepřidávej nadpis ani emoji, vrať jen samotný text inzerátu, žádné komentáře navíc.`;
  const userPrompt = `Model: ${nazev}
Rok výroby: ${rok || "neuvedeno"}
Nájezd: ${najezd ? najezd + " km" : "neuvedeno"}
Palivo: ${palivo || "neuvedeno"}
Převodovka: ${prevodovka || "neuvedeno"}
Cena: ${cena ? cena + " " + (mena || "") : "neuvedeno"}
Doplňující info od majitele: ${poznamky || "žádné"}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: "Chyba AI: " + (j?.error?.message || r.statusText) }, { status: 502 });
    }
    const text = j?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: "Chyba AI: " + (e?.message || String(e)) }, { status: 502 });
  }
}
