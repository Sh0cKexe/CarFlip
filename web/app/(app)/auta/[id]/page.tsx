import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AutoDetail from "./AutoDetail";

export default async function AutoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: auto } = await supabase
    .from("auta")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!auto) notFound();

  const { data: naklady } = await supabase
    .from("naklady")
    .select("*")
    .eq("auto_id", id)
    .order("datum", { ascending: false });

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("trh")
    .eq("user_id", user.id)
    .single();

  return (
    <AutoDetail
      userId={user.id}
      auto={auto}
      naklady={naklady ?? []}
      trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"}
    />
  );
}
