import { Banknote, BookOpen, Clock3, FileCheck2, Receipt, Users } from "lucide-react";
import { MiniCalendar, OverviewLayout, SeeMore, TodoCard, WelcomeBanner } from "@/components/overview";
import { Card, EmptyState, StatTile, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { idr, wibDateTime } from "@/lib/format";

export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const [classes, enrollments, invoices, reports, earnings, lessons] = await Promise.all([
    supabase.from("classes").select("id, capacity"),
    supabase.from("enrollments").select("id"),
    supabase.from("invoices").select("id, amount, status, created_at, class:classes(title), student:profiles!invoices_student_id_fkey(full_name)").order("created_at"),
    supabase.from("lesson_reports").select("lesson_id, submitted_at, lesson:lessons(starts_at, class:classes(title))").eq("status", "pending").order("submitted_at"),
    supabase.from("tutor_earnings").select("amount"),
    supabase.from("lessons").select("id, starts_at, ends_at, class:classes(title)").order("starts_at"),
  ]);
  const inv = invoices.data ?? [];
  const unpaid = inv.filter((i) => i.status === "unpaid");
  const pending = (reports.data ?? []) as any[];
  const sum = (rows: { amount: number }[]) => rows.reduce((a, r) => a + r.amount, 0);
  const seats = (classes.data ?? []).reduce((a, c) => a + c.capacity, 0);
  const icon = "size-7";

  return (
    <OverviewLayout
      main={<>
        <WelcomeBanner name={profile.full_name} line="Here is what is happening across your classes today." />
        <Card title="Key figures">
          <div className="grid gap-3 md:grid-cols-2">
            <StatTile icon={<BookOpen className={icon} strokeWidth={1.5} />} label="Total classes" hint="Classes currently offered" value={classes.data?.length ?? 0} />
            <StatTile icon={<Users className={icon} strokeWidth={1.5} />} label="Reserved seats" hint="Paid or unpaid, against capacity" value={`${enrollments.data?.length ?? 0}/${seats}`} />
            <StatTile icon={<Receipt className={icon} strokeWidth={1.5} />} label="Unpaid invoices" hint={idr(sum(unpaid))} value={unpaid.length} />
            <StatTile icon={<Banknote className={icon} strokeWidth={1.5} />} label="Collected payments" hint="Invoices marked Paid only" value={idr(sum(inv.filter((i) => i.status === "paid")))} />
            <StatTile icon={<Clock3 className={icon} strokeWidth={1.5} />} label="Reports awaiting approval" hint="Submitted, not yet approved" value={pending.length} />
            <StatTile icon={<FileCheck2 className={icon} strokeWidth={1.5} />} label="Approved tutor earnings" hint="Recorded on approval" value={idr(sum(earnings.data ?? []))} />
          </div>
        </Card>
        <Card title="Unpaid Invoices" action={<SeeMore href="/admin/invoices?status=unpaid" />}>
          {unpaid.length === 0 ? <EmptyState title="All invoices are settled">New enrollments appear here until you confirm payment.</EmptyState> : (
            <Table><thead><tr><Th>Student</Th><Th>Class</Th><Th right>Amount</Th></tr></thead><tbody>
              {unpaid.slice(0, 5).map((i: any) => <tr key={i.id}><Td>{i.student?.full_name}</Td><Td>{i.class?.title}</Td><Td right>{idr(i.amount)}</Td></tr>)}
            </tbody></Table>)}
        </Card>
        <Card title="Reports Awaiting Approval" action={<SeeMore href="/admin/reports" />}>
          {pending.length === 0 ? <EmptyState title="Nothing to approve">Reports appear here after a tutor submits them.</EmptyState> : (
            <Table><thead><tr><Th>Class</Th><Th>Submitted</Th></tr></thead><tbody>
              {pending.slice(0, 5).map((r) => <tr key={r.lesson_id}><Td>{r.lesson?.class?.title}</Td><Td>{wibDateTime(r.submitted_at)}</Td></tr>)}
            </tbody></Table>)}
        </Card>
      </>}
      side={<>
        <MiniCalendar basePath="/admin" cal={sp.cal as string} day={sp.day as string}
          lessons={((lessons.data ?? []) as any[]).map((l) => ({ id: l.id, starts_at: l.starts_at, ends_at: l.ends_at, title: l.class.title }))} />
        <TodoCard items={[
          ...(unpaid.length ? [{ href: "/admin/invoices?status=unpaid", label: `${unpaid.length} unpaid invoice${unpaid.length > 1 ? "s" : ""} to confirm` }] : []),
          ...(pending.length ? [{ href: "/admin/reports", label: `${pending.length} report${pending.length > 1 ? "s" : ""} to approve` }] : []),
        ]} />
      </>}
    />
  );
}
