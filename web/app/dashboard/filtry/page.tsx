import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FiltryForm from "./FiltryForm";

export default async function FiltryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("user_id, filtry, trh")
    .eq("user_id", user.id)
    .single();

  return <FiltryForm email={user.email ?? ""} nastaveni={nastaveni} />;
}
