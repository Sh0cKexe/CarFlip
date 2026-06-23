import { redirect } from "next/navigation";
import { createClient, getUzivatel, getTrh } from "@/utils/supabase/server";
import { zacatekMesice } from "@/lib/aiLimit";
import AiInzeratForm from "./AiInzeratForm";

export default async function AiInzeratPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [trh, { count: vyuzito }] = await Promise.all([
    getTrh(user.id),
    supabase.from("ai_inzeraty").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("vytvoreno", zacatekMesice()),
  ]);

  return <AiInzeratForm trh={trh} vyuzitoVychozi={vyuzito ?? 0} />;
}
