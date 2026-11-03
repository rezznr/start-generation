import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassForm } from "@/components/class-form";
import { CapacityIndicator, Card, EmptyState, InvoiceStatus, PageHeader, ReportStatus, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { duration, idr, wibDateTime, wibRange } from "@/lib/format";

const tabs = ["overview", "students", "schedule", "reports"] as const;

export default async function AdminClassDetail({ params, searchParams }: PageProps<"/admin/classes/[id]">) {
  const { id } = await params;
  const tab = String((await searchParams).tab ?? "overview");
  const { supabase } = await getSession();
  const [cls, price, rate, tutors, enr, inv, lessons] = await Promise.all([
    supabase.from("classes").select("*, tutor:profiles!classes_tutor_id_fkey(full_name)").eq("id", id).maybeSingle(),
    supabase.from("class_student_pricing").select("student_price").eq("class_id", id).single(),
    supabase.from("class_tutor_rates").select("hourly_rate").eq("class_id", id).single(),
    supabase.from("profiles").select("id, full_name").eq("role", "tutor"),
    supabase.from("enrollments").select("id, created_at, student:profiles!enrollments_student_id_fkey(full_name)").eq("class_id", id),
    supabase.from("invoices").select("enrollment_id, amount, status").eq("class_id", id),
    supabase.from("lessons").select("id, starts_at, ends_at, duration_minutes, report:lesson_reports(status, topic, progress, next_steps)").eq("class_id", id).order("starts_at"),
  ]);
  if (!cls.data) notFound();
  const c = cls.data as any;
  const ls = (lessons.data ?? []) as any[];
  const reserved = enr.data?.length ?? 0;

  return (
    <>
      <PageHeader showTitle title={c.title} description={`Taught by ${c.tutor?.full_name}`}
        actions={<ClassForm tutors={tutors.data ?? []} tutorLocked={ls.length > 0}
          cls={{ ...c, student_price: price.data?.student_price ?? 0, tutor_rate: rate.data?.hourly_rate ?? 0 }} />} />
      <nav aria-label="Class sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <Link key={t} href={`?tab=${t}`} aria-current={tab === t ? "page" : undefined}
            className={`h-11 whitespace-nowrap border-b-2 px-4 pt-2.5 text-sm font-bold capitalize ${tab === t ? "border-gold" : "border-transparent text-muted"}`}>{t}</Link>
        ))}
      </nav>

      {tab === "overview" && (
        <Card><dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-muted">Description</dt><dd>{c.description || "No description."}</dd></div>
          <div><dt className="text-sm text-muted">Seats</dt><dd><CapacityIndicator reserved={reserved} capacity={c.capacity} /></dd></div>
          <div><dt className="text-sm text-muted">Student price</dt><dd className="font-bold tabular-nums">{idr(price.data?.student_price ?? 0)}</dd></div>
          <div><dt className="text-sm text-muted">Tutor rate per hour</dt><dd className="font-bold tabular-nums">{idr(rate.data?.hourly_rate ?? 0)}</dd></div>
        </dl></Card>
      )}
      {tab === "students" && (reserved === 0 ? <EmptyState title="No students yet">Students appear here as soon as they enroll.</EmptyState> : (
        <Table><thead><tr><Th>Student</Th><Th>Enrolled</Th><Th right>Invoice</Th><Th>Status</Th></tr></thead><tbody>
          {(enr.data as any[]).map((e) => { const i = inv.data?.find((x) => x.enrollment_id === e.id); return (
            <tr key={e.id}><Td>{e.student?.full_name}</Td><Td>{wibDateTime(e.created_at)}</Td><Td right>{idr(i?.amount ?? 0)}</Td><Td>{i && <InvoiceStatus status={i.status} />}</Td></tr>); })}
        </tbody></Table>))}
      {tab === "schedule" && (ls.length === 0 ? <EmptyState title="No lessons scheduled">The assigned tutor schedules lessons for this class.</EmptyState> : (
        <Table><thead><tr><Th>When</Th><Th right>Duration</Th></tr></thead><tbody>
          {ls.map((l) => <tr key={l.id}><Td>{wibRange(l.starts_at, l.ends_at)}</Td><Td right>{duration(l.duration_minutes)}</Td></tr>)}
        </tbody></Table>))}
      {tab === "reports" && (ls.filter((l) => l.report).length === 0 ? <EmptyState title="No reports yet">Reports show up after the tutor submits one for an ended lesson.</EmptyState> : (
        <div className="space-y-3">{ls.filter((l) => l.report).map((l) => (
          <Card key={l.id} title={l.report.topic} action={<ReportStatus status={l.report.status} />}>
            <p className="text-xs text-muted">{wibRange(l.starts_at, l.ends_at)}</p>
            <p className="mt-2 text-sm"><b>Progress:</b> {l.report.progress}</p>
            <p className="mt-1 text-sm"><b>Next steps:</b> {l.report.next_steps}</p>
          </Card>))}
        </div>))}
    </>
  );
}
