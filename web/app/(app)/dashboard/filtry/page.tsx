import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FiltryForm from "./FiltryForm";

export default async function FiltryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni, error } = await supabase
    .from("nastaveni")
    .select("user_id, filtry, trh, min_zisk_kc, naklady_dovoz_kc, min_srovnani, posledni_najdi_ted")
    .eq("user_id", user.id)
    .single();

  if (error || !nastaveni) {
    return (
      <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <p className="glass rounded-2xl border border-red-500/40 p-6 text-sm text-red-400">
          Nepodařilo se načíst filtry. Zkus obnovit stránku (Ctrl+Shift+R) – neukládej nic, dokud se nastavení nenačte správně.
        </p>
      </main>
    );
  }

  return <FiltryForm nastaveni={nastaveni} />;
}
