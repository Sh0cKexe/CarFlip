import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AI_MECHANIK_LIMIT, zacatekMesice } from "@/lib/aiLimit";

type ChatZprava = { role: "user" | "assistant"; obsah: string };

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  const { chatId, auto, zprava, historie, jazyk } = body as {
    chatId?: string;
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

  // Limit je na POCET NOVYCH CHATU za mesic, ne na pocet zprav -
  // pokracovani v existujicim chatu (chatId vyplnene) se nepocita.
  let vyuzito = 0;
  if (!chatId) {
    const { count } = await supabase
      .from("ai_mechanik_chaty")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("vytvoreno", zacatekMesice());
    vyuzito = count ?? 0;
    if (vyuzito >= AI_MECHANIK_LIMIT) {
      return NextResponse.json(
        { error: `Dosáhl jsi měsíčního limitu nových chatů s AI mechanikem (${AI_MECHANIK_LIMIT}/měsíc). Limit se obnoví příští měsíc.` },
        { status: 429 }
      );
    }
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

    const novaZpravy = [...(historie ?? []), { role: "user", obsah: zprava }, { role: "assistant", obsah: text }];

    if (chatId) {
      await supabase
        .from("ai_mechanik_chaty")
        .update({ zpravy: novaZpravy, aktualizovano: new Date().toISOString() })
        .eq("id", chatId)
        .eq("user_id", user.id);
      return NextResponse.json({ text });
    } else {
      const { data: radek } = await supabase
        .from("ai_mechanik_chaty")
        .insert({
          user_id: user.id,
          znacka: auto.znacka, model: auto.model, rok: auto.rok, motor: auto.motor, vykon: auto.vykon,
          zpravy: novaZpravy,
        })
        .select("*")
        .single();
      return NextResponse.json({ text, chatId: radek?.id, vyuzito: vyuzito + 1, limit: AI_MECHANIK_LIMIT });
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Chyba AI: " + (e?.message || String(e)) }, { status: 502 });
  }
}
