import { redirect } from "next/navigation";
import { getUzivatel, getTrh } from "@/utils/supabase/server";
import AiMechanikChat from "./AiMechanikChat";

export default async function AiMechanikPage() {
  const user = await getUzivatel();
  if (!user) redirect("/login");
  const trh = await getTrh(user.id);

  return <AiMechanikChat trh={trh} />;
}
