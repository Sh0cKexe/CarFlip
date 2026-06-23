import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AutoDetail from "./AutoDetail";

export default async function AutoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: auto }, { data: naklady }, { data: ukoly }, { data: nastaveni }] = await Promise.all([
    supabase.from("auta").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("naklady").select("*").eq("auto_id", id).order("datum", { ascending: false }),
    supabase.from("ukoly").select("*").eq("auto_id", id).order("vytvoreno", { ascending: true }),
    supabase.from("nastaveni").select("trh").eq("user_id", user.id).single(),
  ]);
  if (!auto) notFound();

  return (
    <AutoDetail
      userId={user.id}
      auto={auto}
      naklady={naklady ?? []}
      ukoly={ukoly ?? []}
      trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"}
    />
  );
}
