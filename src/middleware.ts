import { authPaths, routes } from "@/config/routes";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Preserve refreshed auth cookies when returning a redirect (not `NextResponse.next`). */
function redirectPreservingSupabaseCookies(
  url: URL,
  supabaseResponse: NextResponse
) {
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value);
  });
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // getSession() reads from the cookie — no network call (~0 ms vs ~300 ms).
  // Pages use getUser() for secure server-side data fetching; middleware only
  // needs to know "is there a session?" for routing decisions.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const path = request.nextUrl.pathname;

  if (user && authPaths.includes(path)) {
    const { data: brandRow, error: brandError } = await supabase
      .from("brands")
      .select("category")
      .eq("user_id", user.id)
      .maybeSingle();
    const needsOnboarding =
      !brandError &&
      brandRow &&
      (!brandRow.category || String(brandRow.category).trim() === "");
    const destination = needsOnboarding ? routes.onboarding : routes.dashboard;
    return redirectPreservingSupabaseCookies(
      new URL(destination, request.url),
      supabaseResponse
    );
  }

  if (
    !user &&
    (path.startsWith(routes.dashboard) || path.startsWith(routes.onboarding))
  ) {
    const login = new URL(routes.login, request.url);
    login.searchParams.set("next", path);
    return redirectPreservingSupabaseCookies(login, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
