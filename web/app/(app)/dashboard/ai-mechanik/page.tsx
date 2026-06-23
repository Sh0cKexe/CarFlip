import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AiMechanikChat from "./AiMechanikChat";

export default async function AiMechanikPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("trh")
    .eq("user_id", user.id)
    .single();

  return <AiMechanikChat trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"} />;
}
