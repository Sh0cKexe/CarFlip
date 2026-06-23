import Anthropic from "@anthropic-ai/sdk";
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI mechanik není nastaven (chybí ANTHROPIC_API_KEY na serveru)." },
      { status: 500 }
    );
  }

  const jazykText = jazyk === "sk" ? "slovensky" : "česky";
  const systemPrompt = `Jsi zkušený automechanik-diagnostik. Pracuješ na tomto autě: ${auto.znacka} ${auto.model}, rok výroby ${auto.rok}, motor ${auto.motor}, výkon ${auto.vykon} kW. Odpovídej VÝHRADNĚ ${jazykText} (žádné cizí znaky ani jiný jazyk), věcně a konkrétně, jako zkušený mechanik kolegovi mechanikovi. Mluv konkrétně k tomuto modelu a motoru (typické závady, co kontrolovat, na co si dát pozor), ne obecné fráze. Pokud je dotaz nejasný nebo chybí důležitý detail, doptej se.`;

  const messages = [
    ...(historie ?? []).map((h) => ({ role: h.role, content: h.obsah })),
    { role: "user" as const, content: zprava },
  ];

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: "Chyba AI: " + (e?.message || String(e)) }, { status: 502 });
  }
}
