import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const COOLDOWN_MINUT = 30;
const REPO = "Sh0cKexe/CarFlip";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("posledni_najdi_ted")
    .eq("user_id", user.id)
    .single();

  if (nastaveni?.posledni_najdi_ted) {
    const uplynuloMs = Date.now() - new Date(nastaveni.posledni_najdi_ted).getTime();
    const zbyvaMinut = COOLDOWN_MINUT - Math.floor(uplynuloMs / 60000);
    if (zbyvaMinut > 0) {
      return NextResponse.json({ error: "cooldown", zbyvaMinut }, { status: 429 });
    }
  }

  if (!process.env.GITHUB_PAT) {
    return NextResponse.json({ error: "Najdi teď není nastaveno (chybí klíč na serveru)." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("nastaveni")
    .update({ posledni_najdi_ted: new Date().toISOString() })
    .eq("user_id", user.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const r = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/najdi-ted.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { user_id: user.id } }),
    }
  );

  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ error: "Nepodařilo se spustit hledání: " + text }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
