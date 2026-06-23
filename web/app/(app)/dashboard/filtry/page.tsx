import { redirect } from "next/navigation";
import { createClient, getUzivatel } from "@/utils/supabase/server";
import FiltryForm from "./FiltryForm";

export default async function FiltryPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: nastaveni, error } = await supabase
    .from("nastaveni")
    .select("user_id, filtry, trh, min_zisk_kc, naklady_dovoz_kc, min_srovnani, posledni_najdi_ted, najdi_ted_stav, najdi_ted_spusteno")
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

  const jeAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;
  return <FiltryForm nastaveni={nastaveni} jeAdmin={jeAdmin} />;
}
