"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email(), password: z.string().min(1) });

// Returns a fresh object each time so the notification shows again for a repeated error.
export type SignInState = { error: string } | null;

export async function signIn(_: SignInState, form: FormData): Promise<SignInState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email or password is incorrect. Please check your details and try again." };
  // Go straight to the role home: the extra /dashboard hop is one more blank wait.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  redirect(profile ? `/${profile.role}` : "/dashboard");
}
