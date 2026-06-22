import { NextResponse } from "next/server";
import { adminClient, pozadovatOwnera } from "@/utils/supabase/admin";

function vygenerujHeslo(): string {
  const znaky = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let heslo = "";
  for (let i = 0; i < 10; i++) heslo += znaky[Math.floor(Math.random() * znaky.length)];
  return heslo;
}

export async function POST(req: Request) {
  const owner = await pozadovatOwnera();
  if (!owner) return NextResponse.json({ error: "Nepřístupné." }, { status: 403 });

  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "Chybí user_id." }, { status: 400 });

  const admin = adminClient();
  const heslo = vygenerujHeslo();
  const { error } = await admin.auth.admin.updateUserById(user_id, { password: heslo });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, heslo });
}
