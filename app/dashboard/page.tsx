import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Dashboard() {
  const { profile } = await getSession();
  redirect(`/${profile.role}`);
}
