import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { duration, wibRange } from "@/lib/format";

export default async function PaidClass({ params }: PageProps<"/student/classes/[id]">) {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data: cls } = await supabase.from("classes").select("title, description, tutor:profiles!classes_tutor_id_fkey(full_name)").eq("id", id).maybeSingle() as { data: any };
  if (!cls) return <EmptyState title="Class not found">It may have been removed.</EmptyState>;
  const { data: invoice } = await supabase.from("invoices").select("status").eq("class_id", id).maybeSingle();

  if (invoice?.status !== "paid") {
    return (
      <>
        <PageHeader showTitle title={cls.title} description={`with ${cls.tutor?.full_name}`} />
        <EmptyState title="This class is locked" action={<Button href="/student/invoices">Open invoice</Button>}>
          {invoice ? "Schedule and reports unlock after an admin confirms your payment." : "Enroll in this class to reserve a seat."}
        </EmptyState>
      </>
    );
  }
  // Pending reports are filtered out by RLS before they ever reach this page.
  const { data } = await supabase.from("lessons").select("id, starts_at, ends_at, duration_minutes, report:lesson_reports(topic, progress, next_steps)").eq("class_id", id).order("starts_at");
  const lessons = (data ?? []) as any[];

  return (
    <>
      <PageHeader showTitle title={cls.title} description={`${cls.description} Taught by ${cls.tutor?.full_name}.`} />
      {lessons.length === 0 ? <EmptyState title="No lessons yet">Your tutor has not scheduled lessons for this class yet.</EmptyState> : (
        <div className="space-y-3">{lessons.map((l) => (
          <Card key={l.id} title={wibRange(l.starts_at, l.ends_at)} action={<span className="text-sm text-muted">{duration(l.duration_minutes)}</span>}>
            {l.report ? <dl className="space-y-2 text-sm">
              <div><dt className="text-xs font-bold uppercase text-muted">Topic</dt><dd>{l.report.topic}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-muted">Learning progress</dt><dd>{l.report.progress}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-muted">Next steps</dt><dd>{l.report.next_steps}</dd></div></dl>
              : <p className="text-sm text-muted">No approved report for this lesson yet.</p>}
          </Card>))}
        </div>)}
    </>
  );
}
