import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BotForm from "./BotForm";

export default async function BotPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("user_id, telegram_token, telegram_chat_id, dalsi_prijemci, aktivni, trh")
    .eq("user_id", user.id)
    .single();

  return <BotForm email={user.email ?? ""} nastaveni={nastaveni} />;
}
