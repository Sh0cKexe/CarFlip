import { NextResponse } from "next/server";
import { adminClient, pozadovatOwnera } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  const owner = await pozadovatOwnera();
  if (!owner) return NextResponse.json({ error: "Nepřístupné." }, { status: 403 });

  const { user_id, dny } = await req.json();
  if (!user_id || !dny) {
    return NextResponse.json({ error: "Chybí user_id nebo dny." }, { status: 400 });
  }

  const admin = adminClient();
  const { data: aktualni } = await admin
    .from("pristup")
    .select("pristup_do")
    .eq("user_id", user_id)
    .single();

  const zaklad = aktualni?.pristup_do && new Date(aktualni.pristup_do) > new Date()
    ? new Date(aktualni.pristup_do)
    : new Date();
  zaklad.setDate(zaklad.getDate() + Number(dny));

  const { error } = await admin
    .from("pristup")
    .update({ pristup_do: zaklad.toISOString() })
    .eq("user_id", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pristup_do: zaklad.toISOString() });
}
