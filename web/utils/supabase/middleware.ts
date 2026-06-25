import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;
  const skipUdrzba = path.startsWith("/udrzba") || path.startsWith("/admin") || path.startsWith("/api/admin");
  if (!skipUdrzba) {
    const { data: konfig } = await supabase.from("konfigurace").select("hodnota").eq("klic", "udrzba").single();
    if (konfig?.hodnota === "true") {
      const url = request.nextUrl.clone();
      url.pathname = "/udrzba";
      return NextResponse.redirect(url);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  const chranenaCesta = path.startsWith("/dashboard") || path.startsWith("/auta");

  if (!user && chranenaCesta) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && chranenaCesta) {
    const { data: pristup } = await supabase
      .from("pristup")
      .select("pristup_do")
      .eq("user_id", user.id)
      .single();
    if (pristup && new Date(pristup.pristup_do) < new Date()) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("vyprselo", "1");
      return NextResponse.redirect(url);
    }
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
