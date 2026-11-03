import { Forbidden } from "@/components/forbidden";
import { getSession } from "@/lib/auth";

export default async function Layout({ children }: LayoutProps<"/student">) {
  const { profile } = await getSession();
  return profile.role === "student" ? children : <Forbidden role={profile.role} />;
}
