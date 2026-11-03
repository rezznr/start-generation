import { Banknote, BookOpen, CalendarClock, Clock3 } from "lucide-react";
import { ReportForm } from "@/components/lesson-forms";
import { MiniCalendar, OverviewLayout, SeeMore, TodoCard, WelcomeBanner } from "@/components/overview";
import { Card, EmptyState, StatTile, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { idr, nowMs, wibRange } from "@/lib/format";
import { tutorLessons } from "@/lib/tutor-data";

export default async function TutorOverview({ searchParams }: PageProps<"/tutor">) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const now = nowMs();
  const [lessons, classes, earnings] = await Promise.all([
    tutorLessons(), supabase.from("classes").select("id"), supabase.from("tutor_earnings").select("amount"),
  ]);
  const missing = lessons.filter((l) => new Date(l.ends_at).getTime() <= now && !l.report);
  const upcoming = lessons.filter((l) => new Date(l.starts_at).getTime() > now);
  const pending = lessons.filter((l) => l.report?.status === "pending");
  const icon = "size-7";

  return (
    <OverviewLayout
      main={<>
        <WelcomeBanner name={profile.full_name} line="Your classes, lessons and reports in one place." />
        <Card title="Key figures">
          <div className="grid gap-3 md:grid-cols-2">
            <StatTile icon={<BookOpen className={icon} strokeWidth={1.5} />} label="Assigned classes" hint="Classes you teach" value={classes.data?.length ?? 0} />
            <StatTile icon={<CalendarClock className={icon} strokeWidth={1.5} />} label="Upcoming lessons" hint="Scheduled, not started" value={upcoming.length} />
            <StatTile icon={<Clock3 className={icon} strokeWidth={1.5} />} label="Reports pending" hint="Waiting for an admin" value={pending.length} />
            <StatTile icon={<Banknote className={icon} strokeWidth={1.5} />} label="Approved earnings" hint="Recorded after approval" value={idr((earnings.data ?? []).reduce((a, r) => a + r.amount, 0))} />
          </div>
        </Card>
        <Card title="Reports to Write" action={<SeeMore href="/tutor/reports" />}>
          {missing.length === 0 ? <EmptyState title="You are all caught up">Finished lessons without a report will appear here.</EmptyState> : (
            <Table><thead><tr><Th>Lesson</Th><Th /></tr></thead><tbody>
              {missing.map((l) => <tr key={l.id}><Td><b>{l.class.title}</b><br /><span className="text-muted">{wibRange(l.starts_at, l.ends_at)}</span></Td><Td right><ReportForm lessonId={l.id} /></Td></tr>)}
            </tbody></Table>)}
        </Card>
        <Card title="Next Lessons" action={<SeeMore href="/tutor/schedule" />}>
          {upcoming.length === 0 ? <EmptyState title="No upcoming lessons">Open Schedule to plan your next lesson.</EmptyState> : (
            <ul className="space-y-2 text-sm">{upcoming.slice(0, 5).map((l) => <li key={l.id} className="rounded-card bg-canvas/70 p-3"><b>{l.class.title}</b><br /><span className="text-muted">{wibRange(l.starts_at, l.ends_at)}</span></li>)}</ul>)}
        </Card>
      </>}
      side={<>
        <MiniCalendar basePath="/tutor" cal={sp.cal as string} day={sp.day as string}
          lessons={lessons.map((l) => ({ id: l.id, starts_at: l.starts_at, ends_at: l.ends_at, title: l.class.title }))} />
        <TodoCard items={missing.length ? [{ href: "/tutor/reports", label: `${missing.length} report${missing.length > 1 ? "s" : ""} to write` }] : []} />
      </>}
    />
  );
}
