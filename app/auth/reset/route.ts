import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Clears a session that is still cryptographically valid but no longer usable (for example the user
// or profile was removed). Server Components cannot write cookies, so this route does it and then
// sends the visitor to the login page. Without it the proxy and the layout bounce between each other.
export async function GET(request: Request) {
  await (await createClient()).auth.signOut({ scope: "local" }).catch(() => {});
  return NextResponse.redirect(new URL("/login", request.url));
}
