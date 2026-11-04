import { Suspense, type ReactNode } from "react";
import { AppFrame } from "@/components/app-frame";
import { ShellSkeleton } from "@/components/shell-skeleton";
import { getSession } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import { nav } from "@/lib/nav";

async function Frame({ children }: { children: ReactNode }) {
  const { profile } = await getSession();
  return (
    <AppFrame items={nav[profile.role]} name={profile.full_name} role={profile.role} signOut={signOut}>
      {children}
    </AppFrame>
  );
}

// The layout itself must not wait on the session: without this Suspense the browser shows a blank
// page until the lookup finishes. The shell skeleton paints at once and the live frame replaces it.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Frame>{children}</Frame>
    </Suspense>
  );
}
