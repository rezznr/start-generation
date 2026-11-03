import { FilterSelect } from "@/components/filter-select";
import { DeleteLesson, LessonForm } from "@/components/lesson-forms";
import { currentMonth, ScheduleCalendar } from "@/components/schedule-calendar";
import { EmptyState, PageHeader, Table, Td, Th, StatusBadge } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { duration, wibRange } from "@/lib/format";
import { tutorLessons } from "@/lib/tutor-data";

export default async function TutorSchedule({ searchParams }: PageProps<"/tutor/schedule">) {
  const sp = await searchParams;
  const cls = String(sp.class ?? "");
  const month = currentMonth(sp.month as string | undefined);
  const { supabase } = await getSession();
  const [all, classes] = await Promise.all([tutorLessons(), supabase.from("classes").select("id, title")]);
  const lessons = all.filter((l) => !cls || l.class_id === cls);
  const list = classes.data ?? [];

  return (
    <>
      <PageHeader title="Schedule" description="Plan lessons in WIB. Approved lessons are locked."
        actions={<>
          <FilterSelect name="class" label="Filter by class" options={[{ value: "", label: "All classes" }, ...list.map((c) => ({ value: c.id, label: c.title }))]} />
          {list.length > 0 && <LessonForm classes={list} />}
        </>} />
      {list.length === 0 ? <EmptyState title="Nothing to schedule yet">You need an assigned class before you can schedule lessons.</EmptyState> : (
        <div className="space-y-8">
          <ScheduleCalendar month={month} basePath="/tutor/schedule" extraParams={cls ? `&class=${cls}` : ""}
            lessons={lessons.map((l) => ({ id: l.id, title: l.class.title, starts_at: l.starts_at, ends_at: l.ends_at, minutes: l.duration_minutes }))} />
          <section>
            <h2 className="mb-3 text-lg font-bold">All lessons</h2>
            {lessons.length === 0 ? <EmptyState title="No lessons yet">Use Schedule lesson to add the first one.</EmptyState> : (
              <Table><thead><tr><Th>Class</Th><Th>When</Th><Th right>Duration</Th><Th>State</Th><Th /></tr></thead><tbody>
                {lessons.map((l) => (
                  <tr key={l.id}><Td className="font-medium">{l.class.title}</Td><Td>{wibRange(l.starts_at, l.ends_at)}</Td><Td right>{duration(l.duration_minutes)}</Td>
                    <Td>{l.approved_at ? <StatusBadge tone="success">Approved (locked)</StatusBadge> : <StatusBadge tone="neutral">Editable</StatusBadge>}</Td>
                    <Td right>{!l.approved_at && <span className="inline-flex gap-1"><LessonForm classes={list} lesson={l} /><DeleteLesson id={l.id} /></span>}</Td></tr>))}
              </tbody></Table>)}
          </section>
        </div>)}
    </>
  );
}
