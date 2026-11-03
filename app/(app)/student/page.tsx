import { BookOpen, CalendarClock, Hourglass } from "lucide-react";
import { MiniCalendar, OverviewLayout, SeeMore, TodoCard, WelcomeBanner } from "@/components/overview";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, InvoiceStatus, StatTile } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { idr, nowMs, wibRange } from "@/lib/format";

export default async function StudentOverview({ searchParams }: PageProps<"/student">) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const [invoices, lessons] = await Promise.all([
    supabase.from("invoices").select("id, amount, status, class:classes(id, title)").order("created_at"),
    // RLS returns lessons of paid classes only.
    supabase.from("lessons").select("id, starts_at, ends_at, class:classes(title)").order("starts_at"),
  ]);
  const inv = (invoices.data ?? []) as any[];
  const unpaid = inv.filter((i) => i.status === "unpaid");
  const paid = inv.filter((i) => i.status === "paid");
  const all = (lessons.data ?? []) as any[];
  const upcoming = all.filter((l) => new Date(l.starts_at).getTime() > nowMs());
  const icon = "size-7";

  return (
    <OverviewLayout
      main={<>
        <WelcomeBanner name={profile.full_name} line="Great effort so far, keep up the good work!" />
        <Card title="My Classes" action={<SeeMore href="/student/classes" />}>
          {paid.length === 0 ? <EmptyState title="No classes enrolled" action={<Button href="/student/browse" size="sm">Browse classes</Button>}>Pick a class, and it opens after an admin confirms your payment.</EmptyState> : (
            <ul className="grid gap-3 md:grid-cols-2">{paid.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 rounded-card bg-canvas/70 p-4">
                <span className="font-bold">{i.class.title}</span>
                <Button href={`/student/classes/${i.class.id}`} size="sm">Open</Button>
              </li>))}</ul>)}
        </Card>
        <Card title="Learning Summary">
          <div className="grid gap-3 md:grid-cols-3">
            <StatTile icon={<BookOpen className={icon} strokeWidth={1.5} />} label="Paid classes" hint="You can access" value={paid.length} />
            <StatTile icon={<Hourglass className={icon} strokeWidth={1.5} />} label="Awaiting payment" hint="Seat held, locked" value={unpaid.length} />
            <StatTile icon={<CalendarClock className={icon} strokeWidth={1.5} />} label="Upcoming lessons" hint="In paid classes" value={upcoming.length} />
          </div>
        </Card>
        <Card title="Unpaid Invoices" action={<SeeMore href="/student/invoices" />}>
          {unpaid.length === 0 ? <EmptyState title="No unpaid invoices">An invoice appears as soon as you enroll in a class.</EmptyState> : (
            <ul className="space-y-3">{unpaid.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-canvas/70 p-4 text-sm">
                <span><b>{i.class.title}</b><br /><span className="tabular-nums text-muted">{idr(i.amount)}</span></span>
                <span className="flex items-center gap-3"><InvoiceStatus status="unpaid" /><Button href="/student/invoices" size="sm" variant="outline">Open invoice</Button></span>
              </li>))}</ul>)}
        </Card>
      </>}
      side={<>
        <MiniCalendar basePath="/student" cal={sp.cal as string} day={sp.day as string}
          lessons={all.map((l) => ({ id: l.id, starts_at: l.starts_at, ends_at: l.ends_at, title: l.class.title }))} />
        <TodoCard items={[
          ...unpaid.map((i) => ({ href: "/student/invoices", label: `Payment pending: ${i.class.title}` })),
          ...upcoming.slice(0, 2).map((l) => ({ href: "/student/schedule", label: `${l.class.title}, ${wibRange(l.starts_at, l.ends_at)}` })),
        ]} />
      </>}
    />
  );
}
