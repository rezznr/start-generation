import { Forbidden } from "@/components/forbidden";
import { getSession } from "@/lib/auth";

export default async function Layout({ children }: LayoutProps<"/admin">) {
  const { profile } = await getSession();
  return profile.role === "admin" ? children : <Forbidden role={profile.role} />;
}
