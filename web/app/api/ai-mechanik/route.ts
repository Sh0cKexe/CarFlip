import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ChatZprava = { role: "user" | "assistant"; obsah: string };

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  const { auto, zprava, historie, jazyk } = body as {
    auto: { znacka: string; model: string; rok: string; motor: string; vykon: string };
    zprava: string;
    historie: ChatZprava[];
    jazyk: string;
  };

  if (!auto?.znacka || !auto?.model || !auto?.rok || !auto?.motor || !auto?.vykon) {
    return NextResponse.json({ error: "Chybí údaje o autě (značka/model/rok/motor/výkon)." }, { status: 400 });
  }
  if (!zprava) {
    return NextResponse.json({ error: "Napiš otázku." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Musíš být přihlášen." }, { status: 401 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "AI mechanik není nastaven (chybí GROQ_API_KEY na serveru)." },
      { status: 500 }
    );
  }

  const jazykText = jazyk === "sk" ? "slovensky" : "česky";
  const systemPrompt = `Jsi zkušený automechanik-diagnostik. Pracuješ na tomto autě: ${auto.znacka} ${auto.model}, rok výroby ${auto.rok}, motor ${auto.motor}, výkon ${auto.vykon} kW. Odpovídej VÝHRADNĚ ${jazykText} (žádné cizí znaky ani jiný jazyk), věcně a konkrétně, jako zkušený mechanik kolegovi mechanikovi. Mluv konkrétně k tomuto modelu a motoru (typické závady, co kontrolovat, na co si dát pozor), ne obecné fráze. Pokud je dotaz nejasný nebo chybí důležitý detail, doptej se.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(historie ?? []).map((h) => ({ role: h.role, content: h.obsah })),
    { role: "user", content: zprava },
  ];

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages }),
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
