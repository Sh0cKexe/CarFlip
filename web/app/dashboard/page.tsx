import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardForm from "./DashboardForm";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return <DashboardForm email={user.email ?? ""} nastaveni={nastaveni} />;
}
