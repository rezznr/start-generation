import { currentMonth, ScheduleCalendar } from "@/components/schedule-calendar";
import { FilterSelect } from "@/components/filter-select";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { getSession } from "@/lib/auth";

export default async function StudentSchedule({ searchParams }: PageProps<"/student/schedule">) {
  const sp = await searchParams;
  const cls = String(sp.class ?? "");
  const { supabase } = await getSession();
  // The database only returns lessons of classes this student has paid for.
  const { data } = await supabase.from("lessons").select("id, class_id, starts_at, ends_at, duration_minutes, class:classes(title, tutor:profiles!classes_tutor_id_fkey(full_name))").order("starts_at");
  const all = (data ?? []) as any[];
  const classes = [...new Map(all.map((l) => [l.class_id, l.class.title])).entries()];
  const lessons = all.filter((l) => !cls || l.class_id === cls);

  return (
    <>
      <PageHeader title="Schedule" description="Lessons for the classes you have paid for, in WIB."
        actions={classes.length > 1 ? <FilterSelect name="class" label="Filter by class" options={[{ value: "", label: "All classes" }, ...classes.map(([v, label]) => ({ value: v, label }))]} /> : undefined} />
      {all.length === 0 ? <EmptyState title="No lessons to show">Your schedule opens once an admin confirms payment for a class and the tutor schedules lessons.</EmptyState> : (
        <ScheduleCalendar month={currentMonth(sp.month as string | undefined)} basePath="/student/schedule" extraParams={cls ? `&class=${cls}` : ""}
          lessons={lessons.map((l) => ({ id: l.id, title: l.class.title, starts_at: l.starts_at, ends_at: l.ends_at, minutes: l.duration_minutes, detail: <p>Tutor: {l.class.tutor?.full_name}</p> }))} />)}
    </>
  );
}
