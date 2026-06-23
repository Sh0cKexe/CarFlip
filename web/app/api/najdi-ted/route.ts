import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Cooldown zacina pocitat od DOKONCENI behu (posledni_najdi_ted zapisuje
// az najdi_ted_cloud.py na konci), ne od kliknuti - jinak by delsi beh
// "ukradl" cas z cooldownu.
const COOLDOWN_MINUT = 60;
const REPO = "Sh0cKexe/CarFlip";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });

  const jeOwner = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("posledni_najdi_ted, najdi_ted_stav, najdi_ted_spusteno")
    .eq("user_id", user.id)
    .single();

  // "bezi" se pocita jen do 20 min - kdyby GitHub Actions spadl driv, nez
  // stihl zapsat hotovo/chyba, tlacitko by jinak zustalo navzdy blokovane.
  const behZaseknuty = nastaveni?.najdi_ted_spusteno
    && Date.now() - new Date(nastaveni.najdi_ted_spusteno).getTime() > 20 * 60000;
  if (nastaveni?.najdi_ted_stav === "bezi" && !behZaseknuty) {
    return NextResponse.json({ error: "bezi" }, { status: 429 });
  }

  if (!jeOwner && nastaveni?.posledni_najdi_ted) {
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
    .update({ najdi_ted_stav: "bezi", najdi_ted_spusteno: new Date().toISOString() })
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
    // Dispatch se nepovedl - vratit stav zpet, jinak by "bezi" zustalo viset
    // navzdory tomu, ze beh ve skutecnosti vubec nezacal.
    await supabase.from("nastaveni").update({ najdi_ted_stav: null }).eq("user_id", user.id);
    return NextResponse.json({ error: "Nepodařilo se spustit hledání: " + text }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
