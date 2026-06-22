import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/app/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: nastaveni } = await supabase
    .from("nastaveni")
    .select("trh")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email ?? ""} trh={(nastaveni?.trh as "cz" | "sk") ?? "cz"} userId={user.id} />
      {children}
    </div>
  );
}
