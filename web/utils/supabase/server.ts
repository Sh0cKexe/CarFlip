import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll volane ze Server Componentu - middleware session uz refreshuje.
          }
        },
      },
    }
  );
}

/** Layout i kazda stranka pod (app) potrebuje uzivatele - bez cache() by se
 * supabase.auth.getUser() (sitovy dotaz na Supabase Auth) volal znovu pro
 * layout i pro page pri kazde navigaci. React cache() dedupuje volani se
 * stejnymi argumenty v ramci jednoho requestu. */
export const getUzivatel = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/** Stejny dedupe pro nastaveni.trh - layout ho potrebuje pro Sidebar a
 * vetsina stranek ho potrebuje znovu jen pro spravny jazyk/menu textu. */
export const getTrh = cache(async (userId: string): Promise<"cz" | "sk"> => {
  const supabase = await createClient();
  const { data } = await supabase.from("nastaveni").select("trh").eq("user_id", userId).single();
  return (data?.trh as "cz" | "sk") ?? "cz";
});
