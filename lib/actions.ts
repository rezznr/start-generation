"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fromWibInput } from "@/lib/format";

export type State = { error?: string; ok?: boolean } | null;

const fail = (message: string): State => ({ error: message });
const done = (): State => { revalidatePath("/", "layout"); return { ok: true }; };
const friendly = (m: string) =>
  m.includes("lessons_tutor_id_tstzrange_excl") ? "This time overlaps another lesson of yours." : m;
const text = (label: string) => z.string().trim().min(1, `${label} is required`);

export async function signOut() {
  await (await createClient()).auth.signOut();
  redirect("/login");
}

const classSchema = z.object({
  id: z.string().optional(),
  title: text("Title"),
  description: z.string().trim(),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  tutor_id: z.uuid("Choose a tutor"),
  student_price: z.coerce.number().int().min(0, "Student price cannot be negative"),
  tutor_rate: z.coerce.number().int().min(0, "Tutor rate cannot be negative"),
});

export async function saveClass(_: State, form: FormData): Promise<State> {
  const p = classSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return fail(p.error.issues[0].message);
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("save_class", {
    p_id: p.data.id || null, p_title: p.data.title, p_description: p.data.description,
    p_capacity: p.data.capacity, p_tutor_id: p.data.tutor_id,
    p_student_price: p.data.student_price, p_tutor_rate: p.data.tutor_rate,
  });
  return error ? fail(error.message) : done();
}

export async function enrollInClass(_: State, form: FormData): Promise<State> {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("enroll", { p_class_id: String(form.get("class_id")) });
  return error ? fail(error.message) : done();
}

export async function markPaid(_: State, form: FormData): Promise<State> {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("mark_invoice_paid", {
    p_invoice_id: String(form.get("invoice_id")), p_ref: String(form.get("ref") ?? ""),
  });
  return error ? fail(error.message) : done();
}

export async function approveReport(_: State, form: FormData): Promise<State> {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc("approve_report", { p_lesson_id: String(form.get("lesson_id")) });
  return error ? fail(error.message) : done();
}

const lessonSchema = z.object({
  id: z.string().optional(),
  class_id: z.uuid("Choose a class"),
  starts: z.string().min(1, "Start time is required"),
  ends: z.string().min(1, "End time is required"),
});

export async function saveLesson(_: State, form: FormData): Promise<State> {
  const p = lessonSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return fail(p.error.issues[0].message);
  const starts_at = fromWibInput(p.data.starts);
  const ends_at = fromWibInput(p.data.ends);
  if (new Date(ends_at) <= new Date(starts_at)) return fail("The end time must be after the start time.");
  const { supabase } = await getSession();
  const { error } = p.data.id
    ? await supabase.from("lessons").update({ starts_at, ends_at }).eq("id", p.data.id)
    : await supabase.from("lessons").insert({ class_id: p.data.class_id, starts_at, ends_at });
  return error ? fail(friendly(error.message)) : done();
}

export async function deleteLesson(_: State, form: FormData): Promise<State> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("lessons").delete().eq("id", String(form.get("lesson_id")));
  return error ? fail(error.message) : done();
}

const reportSchema = z.object({
  lesson_id: z.uuid(), topic: text("Topic"), progress: text("Learning progress"), next_steps: text("Next steps"),
});

export async function saveReport(_: State, form: FormData): Promise<State> {
  const p = reportSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return fail(p.error.issues[0].message);
  const { supabase } = await getSession();
  const { lesson_id, ...fields } = p.data;
  const { data: existing } = await supabase.from("lesson_reports").select("id").eq("lesson_id", lesson_id).maybeSingle();
  const { error } = existing
    ? await supabase.from("lesson_reports").update(fields).eq("lesson_id", lesson_id)
    : await supabase.from("lesson_reports").insert({ lesson_id, ...fields });
  return error ? fail(error.message) : done();
}
