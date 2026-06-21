import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ZiskovostForm from "./ZiskovostForm";

export default async function ZiskovostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("user_id, min_zisk_kc, naklady_dovoz_kc, min_srovnani, trh")
    .eq("user_id", user.id)
    .single();

  return <ZiskovostForm email={user.email ?? ""} nastaveni={nastaveni} />;
}
