import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let email: string, heslo: string, kod: string;
  try {
    const body = await req.json();
    email = body.email;
    heslo = body.heslo;
    kod = (body.kod || "").trim();
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  if (!email || !heslo || !kod) {
    return NextResponse.json({ error: "Vyplň e-mail, heslo i invite kód." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Registrace není nastavena (chybí klíč na serveru)." }, { status: 500 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: kodRadek } = await admin
    .from("invite_kody")
    .select("kod, dny_platnosti, pouzil_user_id")
    .eq("kod", kod)
    .single();

  if (!kodRadek || kodRadek.pouzil_user_id) {
    return NextResponse.json({ error: "Neplatný nebo už použitý invite kód." }, { status: 400 });
  }

  const { data: novyUzivatel, error: createError } = await admin.auth.admin.createUser({
    email,
    password: heslo,
    email_confirm: true,
  });
  if (createError || !novyUzivatel.user) {
    return NextResponse.json({ error: createError?.message || "Účet se nepodařilo vytvořit." }, { status: 400 });
  }

  const pristupDo = new Date();
  pristupDo.setDate(pristupDo.getDate() + kodRadek.dny_platnosti);

  await admin.from("pristup").insert({
    user_id: novyUzivatel.user.id,
    email,
    pristup_do: pristupDo.toISOString(),
  });
  await admin.from("invite_kody").update({
    pouzil_user_id: novyUzivatel.user.id,
    pouzito_kdy: new Date().toISOString(),
  }).eq("kod", kod);

  return NextResponse.json({ ok: true });
}
