import { redirect } from "next/navigation";
import { createClient, getUzivatel, getTrh } from "@/utils/supabase/server";
import { zacatekMesice } from "@/lib/aiLimit";
import DashboardOverview from "./DashboardOverview";

export default async function DashboardPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [
    trh,
    { data: auta },
    { data: naklady },
    { count: otevreneUkoly },
    { count: aiRozboru },
    { count: aiInzeratu },
    { count: aiMechanikChatu },
  ] = await Promise.all([
    getTrh(user.id),
    supabase.from("auta").select("id, stav, cena_koupeno_kc, cena_prodano_kc, datum_koupeno, datum_prodano").eq("user_id", user.id),
    supabase.from("naklady").select("auto_id, castka_kc").eq("user_id", user.id),
    supabase.from("ukoly").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("hotovo", false),
    supabase.from("ai_rozbory").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("vytvoreno", zacatekMesice()),
    supabase.from("ai_inzeraty").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("vytvoreno", zacatekMesice()),
    supabase.from("ai_mechanik_chaty").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("vytvoreno", zacatekMesice()),
  ]);

  const nakladySuma: Record<string, number> = {};
  (naklady ?? []).forEach((row) => {
    nakladySuma[row.auto_id] = (nakladySuma[row.auto_id] ?? 0) + (row.castka_kc ?? 0);
  });
  const celkoveNaklady = (naklady ?? []).reduce((suma, row) => suma + (row.castka_kc ?? 0), 0);

  let celkovyZisk = 0;
  let pocetKoupeno = 0;
  let pocetVInzerci = 0;
  let pocetProdano = 0;
  let soucetDniDrzeni = 0;
  let pocetSDatumy = 0;
  (auta ?? []).forEach((a) => {
    if (a.stav === "koupeno") pocetKoupeno++;
    if (a.stav === "inzerce") pocetVInzerci++;
    if (a.stav === "prodano") {
      pocetProdano++;
      if (a.cena_koupeno_kc != null && a.cena_prodano_kc != null) {
        celkovyZisk += a.cena_prodano_kc - a.cena_koupeno_kc - (nakladySuma[a.id] ?? 0);
      }
      if (a.datum_koupeno && a.datum_prodano) {
        const dny = (new Date(a.datum_prodano).getTime() - new Date(a.datum_koupeno).getTime()) / 86400000;
        if (dny >= 0) {
          soucetDniDrzeni += dny;
          pocetSDatumy++;
        }
      }
    }
  });

  return (
    <DashboardOverview
      trh={trh}
      pocetAutCelkem={(auta ?? []).length}
      pocetKoupeno={pocetKoupeno}
      pocetVInzerci={pocetVInzerci}
      pocetProdano={pocetProdano}
      celkovyZisk={celkovyZisk}
      celkoveNaklady={celkoveNaklady}
      prumernyZiskAuto={pocetProdano > 0 ? Math.round(celkovyZisk / pocetProdano) : null}
      prumernaDobaDrzeniDni={pocetSDatumy > 0 ? Math.round(soucetDniDrzeni / pocetSDatumy) : null}
      otevreneUkoly={otevreneUkoly ?? 0}
      aiRozboru={aiRozboru ?? 0}
      aiInzeratu={aiInzeratu ?? 0}
      aiMechanikChatu={aiMechanikChatu ?? 0}
    />
  );
}
