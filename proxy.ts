import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie on every request and gates routes.
// Authorization (roles, RLS) is still enforced in the database, not here.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  // getClaims verifies the JWT signature locally (cached JWKS), so no Auth server round trip per request.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const onLogin = request.nextUrl.pathname === "/login";
  if (request.nextUrl.pathname.startsWith("/auth/")) return response;

  if (!user && !onLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (user && onLogin) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
