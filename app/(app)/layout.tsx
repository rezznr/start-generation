import { AppFrame } from "@/components/app-frame";
import { getSession } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import { nav } from "@/lib/nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { profile } = await getSession();
  return (
    <AppFrame items={nav[profile.role]} name={profile.full_name} role={profile.role} signOut={signOut}>
      {children}
    </AppFrame>
  );
}
