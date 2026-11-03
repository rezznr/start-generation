import { Forbidden } from "@/components/forbidden";
import { getSession } from "@/lib/auth";

export default async function Layout({ children }: LayoutProps<"/tutor">) {
  const { profile } = await getSession();
  return profile.role === "tutor" ? children : <Forbidden role={profile.role} />;
}
