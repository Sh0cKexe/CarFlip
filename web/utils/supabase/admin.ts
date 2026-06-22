import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

export function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function pozadovatOwnera() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) {
    return null;
  }
  return user;
}
