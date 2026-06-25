import { NextResponse } from "next/server";
import { pozadovatOwnera, adminClient } from "@/utils/supabase/admin";

export async function GET() {
  const owner = await pozadovatOwnera();
  if (!owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = adminClient();
  const { data } = await admin.from("konfigurace").select("hodnota").eq("klic", "udrzba").single();
  return NextResponse.json({ udrzba: data?.hodnota === "true" });
}

export async function POST(req: Request) {
  const owner = await pozadovatOwnera();
  if (!owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { udrzba } = await req.json() as { udrzba: boolean };
  const admin = adminClient();
  await admin.from("konfigurace").upsert({ klic: "udrzba", hodnota: udrzba ? "true" : "false" });
  return NextResponse.json({ udrzba });
}
