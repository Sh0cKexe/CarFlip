import { redirect } from "next/navigation";
import { adminClient, pozadovatOwnera } from "@/utils/supabase/admin";
import AdminPanel, { type Clen, type NepouzityKod } from "./AdminPanel";

export default async function AdminPage() {
  const owner = await pozadovatOwnera();
  if (!owner) redirect("/dashboard");

  const admin = adminClient();

  const [{ data: uzivatele }, { data: pristupy }, { data: kody }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from("pristup").select("user_id, pristup_do"),
    admin.from("invite_kody").select("kod, dny_platnosti, vytvoreno").is("pouzil_user_id", null).order("vytvoreno", { ascending: false }),
  ]);

  const pristupMapa = new Map((pristupy ?? []).map((p) => [p.user_id, p.pristup_do]));

  const clenove: Clen[] = (uzivatele?.users ?? [])
    .map((u) => ({
      user_id: u.id,
      email: u.email ?? "",
      pristup_do: pristupMapa.get(u.id) ?? null,
    }))
    .sort((a, b) => {
      if (!a.pristup_do) return 1;
      if (!b.pristup_do) return -1;
      return new Date(a.pristup_do).getTime() - new Date(b.pristup_do).getTime();
    });

  return <AdminPanel clenove={clenove} nepouziteKody={(kody ?? []) as NepouzityKod[]} />;
}
