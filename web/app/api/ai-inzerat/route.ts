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

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: "AI generátor není nastaven (chybí GOOGLE_AI_API_KEY na serveru)." },
      { status: 500 }
    );
  }

  const jazykText = jazyk === "sk" ? "slovensky" : "česky";
  const prompt = `Napiš inzerát na prodej ojetého auta na bazar (Bazoš) ${jazykText}. Piš přirozeně, jako normální člověk – ŽÁDNÉ reklamní klišé typu "Prodávám tuto raketu" nebo přehnaně nadšený tón. Krátké věty, věcné a důvěryhodné, ale ať auto zní lákavě. Nepřidávej nadpis ani emoji, vrať jen samotný text inzerátu.

Model: ${nazev}
Rok výroby: ${rok || "neuvedeno"}
Nájezd: ${najezd ? najezd + " km" : "neuvedeno"}
Palivo: ${palivo || "neuvedeno"}
Převodovka: ${prevodovka || "neuvedeno"}
Cena: ${cena ? cena + " " + (mena || "") : "neuvedeno"}
Doplňující info od majitele: ${poznamky || "žádné"}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const j = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: "Chyba AI: " + (j?.error?.message || r.statusText) }, { status: 502 });
    }
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: "Chyba AI: " + (e?.message || String(e)) }, { status: 502 });
  }
}
