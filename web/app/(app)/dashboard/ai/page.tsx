import { redirect } from "next/navigation";
import { createClient, getUzivatel, getTrh } from "@/utils/supabase/server";
import { zacatekMesice } from "@/lib/aiLimit";
import AiRozborForm, { type Rozbor } from "./AiRozborForm";

export default async function AiPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [trh, { data: historie }, { count: vyuzito }] = await Promise.all([
    getTrh(user.id),
    supabase.from("ai_rozbory").select("*").eq("user_id", user.id).order("vytvoreno", { ascending: false }).limit(30),
    supabase.from("ai_rozbory").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("vytvoreno", zacatekMesice()),
  ]);

  return (
    <AiRozborForm
      trh={trh}
      historie={(historie ?? []) as Rozbor[]}
      vyuzitoVychozi={vyuzito ?? 0}
    />
  );
}
