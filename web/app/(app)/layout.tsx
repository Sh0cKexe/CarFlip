import { redirect } from "next/navigation";
import { getUzivatel, getTrh } from "@/utils/supabase/server";
import Sidebar from "@/app/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const trh = await getTrh(user.id);

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email ?? ""} trh={trh} userId={user.id} />
      {children}
    </div>
  );
}
