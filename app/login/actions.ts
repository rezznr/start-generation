"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email(), password: z.string().min(1) });

export async function signIn(_: string | null, form: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Enter a valid email and password.";
  const { error } = await (await createClient()).auth.signInWithPassword(parsed.data);
  if (error) return "Email or password is incorrect.";
  redirect("/dashboard");
}
