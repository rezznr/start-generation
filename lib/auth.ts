import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "tutor" | "student";

// One lookup per request. The role is read from the database, never from user-editable metadata.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id, role, full_name").eq("id", data.user.id).single();
  if (!profile) redirect("/login");
  return { supabase, profile: profile as { id: string; role: Role; full_name: string } };
});
