import { redirect } from "next/navigation";
import { createClient, getUzivatel } from "@/utils/supabase/server";
import BotForm from "./BotForm";

export default async function BotPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: nastaveni, error } = await supabase
    .from("nastaveni")
    .select("user_id, telegram_token, telegram_chat_id, dalsi_prijemci, aktivni, trh, posledni_beh, najdi_ted_stav, posledni_najdi_ted, najdi_ted_spusteno, posledni_chyba")
    .eq("user_id", user.id)
    .single();

  if (error || !nastaveni) {
    return (
      <main className="flex-1 px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <p className="glass rounded-2xl border border-red-500/40 p-6 text-sm text-red-400">
          Nepodařilo se načíst nastavení bota. Zkus obnovit stránku (Ctrl+Shift+R) – neukládej nic, dokud se nastavení nenačte správně.
        </p>
      </main>
    );
  }

  return <BotForm nastaveni={nastaveni} />;
}
