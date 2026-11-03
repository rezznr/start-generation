import { getSession } from "@/lib/auth";

// RLS already limits these rows to the signed-in tutor. Student prices are not readable at all.
export async function tutorLessons() {
  const { supabase } = await getSession();
  const { data } = await supabase.from("lessons")
    .select("id, class_id, starts_at, ends_at, duration_minutes, approved_at, class:classes(title), report:lesson_reports(status, topic, progress, next_steps), rate:lesson_rates(hourly_rate)")
    .order("starts_at");
  return (data ?? []) as any[];
}
