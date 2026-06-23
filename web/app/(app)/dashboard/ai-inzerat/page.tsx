import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AiInzeratForm from "./AiInzeratForm";

export default async function AiInzeratPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("trh")
    .eq("user_id", user.id)
    .single();

  return <AiInzeratForm trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"} />;
}
