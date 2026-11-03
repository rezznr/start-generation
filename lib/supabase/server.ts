import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Runs in the user's context so RLS applies. The service-role key is never used here.
export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Called from a Server Component: session refresh happens in the proxy instead.
          }
        },
      },
    },
  );
}
