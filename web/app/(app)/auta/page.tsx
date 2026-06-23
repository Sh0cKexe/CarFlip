import { redirect } from "next/navigation";
import { createClient, getUzivatel, getTrh } from "@/utils/supabase/server";
import AutaList, { type Auto } from "./AutaList";

export default async function AutaPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [{ data: auta }, { data: naklady }, trh] = await Promise.all([
    supabase.from("auta").select("*").eq("user_id", user.id).order("vytvoreno", { ascending: false }),
    supabase.from("naklady").select("auto_id, castka_kc").eq("user_id", user.id),
    getTrh(user.id),
  ]);

  const nakladySuma: Record<string, number> = {};
  (naklady ?? []).forEach((row) => {
    nakladySuma[row.auto_id] = (nakladySuma[row.auto_id] ?? 0) + (row.castka_kc ?? 0);
  });

  return (
    <AutaList
      userId={user.id}
      auta={(auta ?? []) as Auto[]}
      nakladySuma={nakladySuma}
      trh={trh}
    />
  );
}
