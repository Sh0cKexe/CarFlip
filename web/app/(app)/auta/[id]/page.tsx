import { notFound, redirect } from "next/navigation";
import { createClient, getUzivatel, getTrh } from "@/utils/supabase/server";
import AutoDetail from "./AutoDetail";

export default async function AutoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const [{ data: auto }, { data: naklady }, { data: ukoly }, trh] = await Promise.all([
    supabase.from("auta").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("naklady").select("*").eq("auto_id", id).order("datum", { ascending: false }),
    supabase.from("ukoly").select("*").eq("auto_id", id).order("vytvoreno", { ascending: true }),
    getTrh(user.id),
  ]);
  if (!auto) notFound();

  return (
    <AutoDetail
      userId={user.id}
      auto={auto}
      naklady={naklady ?? []}
      ukoly={ukoly ?? []}
      trh={trh}
    />
  );
}
