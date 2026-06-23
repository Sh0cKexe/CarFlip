import { redirect } from "next/navigation";
import { createClient, getUzivatel, getTrh } from "@/utils/supabase/server";
import { zacatekMesice } from "@/lib/aiLimit";
import AiMechanikChat, { type MechanikChat } from "./AiMechanikChat";

export default async function AiMechanikPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [trh, { data: historie }, { count: vyuzito }] = await Promise.all([
    getTrh(user.id),
    supabase.from("ai_mechanik_chaty").select("*").eq("user_id", user.id).order("aktualizovano", { ascending: false }).limit(30),
    supabase.from("ai_mechanik_chaty").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("vytvoreno", zacatekMesice()),
  ]);

  return <AiMechanikChat trh={trh} vyuzitoVychozi={vyuzito ?? 0} historie={(historie ?? []) as MechanikChat[]} />;
}
