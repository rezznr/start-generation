import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "tutor" | "student";

// One lookup per request. The role is read from the database, never from user-editable metadata.
export const getSession = cache(async () => {
  const supabase = await createClient();
  // Local JWT verification instead of an Auth server call; RLS still checks the token on every query.
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims.sub;
  if (!uid) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id, role, full_name").eq("id", uid).single();
  // A valid token without a profile row would loop through /login and /dashboard; reset clears the cookies first.
  if (!profile) redirect("/auth/reset");
  return { supabase, profile: profile as { id: string; role: Role; full_name: string } };
});
