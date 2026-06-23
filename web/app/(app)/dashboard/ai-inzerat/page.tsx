import { redirect } from "next/navigation";
import { getUzivatel, getTrh } from "@/utils/supabase/server";
import AiInzeratForm from "./AiInzeratForm";

export default async function AiInzeratPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const trh = await getTrh(user.id);

  return <AiInzeratForm trh={trh} />;
}
