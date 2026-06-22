import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardOverview from "./DashboardOverview";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("trh")
    .eq("user_id", user.id)
    .single();

  const { data: auta } = await supabase
    .from("auta")
    .select("id, stav, cena_koupeno_kc, cena_prodano_kc")
    .eq("user_id", user.id);

  const { data: naklady } = await supabase
    .from("naklady")
    .select("auto_id, castka_kc")
    .eq("user_id", user.id);

  const nakladySuma: Record<string, number> = {};
  (naklady ?? []).forEach((row) => {
    nakladySuma[row.auto_id] = (nakladySuma[row.auto_id] ?? 0) + (row.castka_kc ?? 0);
  });

  let celkovyZisk = 0;
  let pocetKoupeno = 0;
  let pocetProdano = 0;
  (auta ?? []).forEach((a) => {
    if (a.stav === "koupeno") pocetKoupeno++;
    if (a.stav === "prodano") {
      pocetProdano++;
      if (a.cena_koupeno_kc != null && a.cena_prodano_kc != null) {
        celkovyZisk += a.cena_prodano_kc - a.cena_koupeno_kc - (nakladySuma[a.id] ?? 0);
      }
    }
  });

  return (
    <DashboardOverview
      trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"}
      pocetAutCelkem={(auta ?? []).length}
      pocetKoupeno={pocetKoupeno}
      pocetProdano={pocetProdano}
      celkovyZisk={celkovyZisk}
    />
  );
}
