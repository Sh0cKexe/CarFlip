import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AutaList, { type Auto } from "./AutaList";

export default async function AutaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: auta }, { data: naklady }, { data: nastaveni }] = await Promise.all([
    supabase.from("auta").select("*").eq("user_id", user.id).order("vytvoreno", { ascending: false }),
    supabase.from("naklady").select("auto_id, castka_kc").eq("user_id", user.id),
    supabase.from("nastaveni").select("trh").eq("user_id", user.id).single(),
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
      trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"}
    />
  );
}
