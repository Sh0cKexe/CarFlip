import { NextResponse } from "next/server";
import { nactiKurzServer } from "@/lib/kurzServer";

export async function GET() {
  const kurz = await nactiKurzServer();
  return NextResponse.json(kurz);
}
