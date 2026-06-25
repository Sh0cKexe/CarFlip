import { NextResponse } from "next/server";
import { adminClient, pozadovatOwnera } from "@/utils/supabase/admin";

function vygenerujKod(): string {
  const znaky = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let kod = "";
  for (let i = 0; i < 8; i++) kod += znaky[Math.floor(Math.random() * znaky.length)];
  return `FLIP-${kod}`;
}

export async function DELETE(req: Request) {
  const owner = await pozadovatOwnera();
  if (!owner) return NextResponse.json({ error: "Nepřístupné." }, { status: 403 });

  const { kod } = await req.json();
  if (!kod) return NextResponse.json({ error: "Chybí kód." }, { status: 400 });

  const admin = adminClient();
  const { error } = await admin.from("invite_kody").delete().eq("kod", kod).is("pouzil_user_id", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const owner = await pozadovatOwnera();
  if (!owner) return NextResponse.json({ error: "Nepřístupné." }, { status: 403 });

  const { dny_platnosti } = await req.json();
  const dny = Number(dny_platnosti) || 30;

  const admin = adminClient();
  const kod = vygenerujKod();
  const { error } = await admin.from("invite_kody").insert({ kod, dny_platnosti: dny });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, kod });
}
