import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { nowMs, wibDay, wibTime } from "@/lib/format";

export function WelcomeBanner({ name, line }: { name: string; line: string }) {
  return (
    <section className="sg-rise banner-gold rounded-card px-8 py-7">
      <h1 className="relative z-10 text-2xl font-bold">Welcome Back, {name.split(" ")[0]}!</h1>
      <p className="relative z-10 mt-1 text-lg">{line}</p>
    </section>
  );
}

export function OverviewLayout({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">{main}</div>
      <div className="min-w-0 space-y-5">{side}</div>
    </div>
  );
}

export const SeeMore = ({ href }: { href: string }) => (
  <Link href={href} className="text-sm font-medium text-muted hover:text-navy">See More</Link>
);

const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const shift = (ym: string, d: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + d, 1)).toISOString().slice(0, 7);
};

type Lesson = { id: string; starts_at: string; ends_at: string; title: string };

// Date picker as plain links, so the chosen month and day live in the URL and work without client JS.
export function MiniCalendar({ lessons, basePath, cal, day }: { lessons: Lesson[]; basePath: string; cal?: string; day?: string }) {
  const today = wibDay(nowMs());
  const month = cal && /^\d{4}-\d{2}$/.test(cal) ? cal : (day ?? today).slice(0, 7);
  const selected = day ?? today;
  const [y, m] = month.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Math.ceil((lead + days) / 7) * 7;
  const withLessons = new Set(lessons.map((l) => wibDay(l.starts_at)));
  const href = (ym: string, d?: string) => `${basePath}?cal=${ym}${d ? `&day=${d}` : ""}`;
  const arrow = "grid size-9 place-items-center rounded-lg bg-canvas hover:bg-navy/10";
  const dayLessons = lessons.filter((l) => wibDay(l.starts_at) === selected);

  return (
    <>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Link href={href(shift(month, -1), selected)} className={arrow} aria-label="Previous month"><ChevronLeft className="size-5" /></Link>
          <h2 className="text-xl font-bold">{monthLabel.format(new Date(Date.UTC(y, m - 1, 1)))}</h2>
          <Link href={href(shift(month, 1), selected)} className={arrow} aria-label="Next month"><ChevronRight className="size-5" /></Link>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="py-1.5 text-sm font-medium">{d}</span>)}
          {Array.from({ length: cells }, (_, i) => {
            const date = new Date(Date.UTC(y, m - 1, i - lead + 1));
            const key = date.toISOString().slice(0, 10);
            const inMonth = key.startsWith(month);
            const isToday = key === today;
            const isSel = key === selected;
            return (
              <Link key={key} href={href(month, key)} aria-label={key} aria-current={isToday ? "date" : undefined}
                className={`mx-auto grid size-10 place-items-center rounded-full text-[15px] ${isSel ? "bg-navy font-medium text-white" : isToday ? "bg-gold-soft font-medium" : "hover:bg-navy/[0.06]"} ${!inMonth && !isSel && !isToday ? "text-muted/60" : ""}`}>
                <span className="relative">{date.getUTCDate()}
                  {withLessons.has(key) && <span className={`absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full ${isSel ? "bg-gold" : "bg-gold-hover"}`} aria-hidden />}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Schedule</h2>
          <Link href={href(today.slice(0, 7), today)} className="text-sm font-medium text-muted hover:text-navy">Today</Link>
        </div>
        <div className="mt-3">
          {dayLessons.length === 0 ? (
            <p className="rounded-card border border-dashed border-muted/50 px-4 py-8 text-center text-muted">No classes scheduled</p>
          ) : (
            <ul className="space-y-2">{dayLessons.map((l) => (
              <li key={l.id} className="rounded-card bg-canvas/70 p-3 text-sm">
                <p className="font-bold">{l.title}</p>
                <p className="text-muted">{wibTime(l.starts_at)} to {wibTime(l.ends_at)} WIB</p>
              </li>))}
            </ul>
          )}
        </div>
      </Card>
    </>
  );
}

export function TodoCard({ items }: { items: { href: string; label: string }[] }) {
  return (
    <Card title="To Do">
      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-muted/50 px-4 py-6 text-center text-sm text-muted">Nothing to do right now</p>
      ) : (
        <ul className="space-y-2">{items.map((i) => (
          <li key={i.href + i.label}><Link href={i.href} className="flex min-h-11 items-center justify-between gap-2 rounded-card bg-canvas/70 px-3 text-sm font-medium hover:bg-navy/[0.06]">{i.label}<ChevronRight className="size-4 text-muted" /></Link></li>))}
        </ul>
      )}
    </Card>
  );
}
