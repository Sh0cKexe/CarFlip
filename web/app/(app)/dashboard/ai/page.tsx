import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { zacatekMesice } from "@/lib/aiLimit";
import AiRozborForm, { type Rozbor } from "./AiRozborForm";

export default async function AiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("trh")
    .eq("user_id", user.id)
    .single();

  const { data: historie } = await supabase
    .from("ai_rozbory")
    .select("*")
    .eq("user_id", user.id)
    .order("vytvoreno", { ascending: false })
    .limit(30);

  const { count: vyuzito } = await supabase
    .from("ai_rozbory")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("vytvoreno", zacatekMesice());

  return (
    <AiRozborForm
      trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"}
      historie={(historie ?? []) as Rozbor[]}
      vyuzitoVychozi={vyuzito ?? 0}
    />
  );
}
