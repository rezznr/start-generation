import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { DetailSheet } from "@/components/ui/dialog-form";
import { EmptyState } from "@/components/ui/card";
import { duration, nowMs, wibDate, wibDay, wibRange, wibTime } from "@/lib/format";
import type { ReactNode } from "react";

export type CalLesson = { id: string; title: string; starts_at: string; ends_at: string; minutes: number; detail?: ReactNode };

const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const shift = (ym: string, d: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + d, 1)).toISOString().slice(0, 7);
};

function Chip({ l }: { l: CalLesson }) {
  return (
    <DetailSheet title={l.title} triggerClassName="block w-full truncate rounded bg-gold/25 px-1.5 py-1 text-left text-xs font-medium hover:bg-gold/50"
      trigger={<>{wibTime(l.starts_at)} {l.title}</>}>
      <p className="font-bold">{wibRange(l.starts_at, l.ends_at)}</p>
      <p className="text-muted">Duration {duration(l.minutes)}</p>
      {l.detail}
    </DetailSheet>
  );
}

// Month grid on desktop, agenda list on small screens. Everything is computed in WIB.
export function ScheduleCalendar({ lessons, month, basePath, extraParams = "" }: {
  lessons: CalLesson[]; month: string; basePath: string; extraParams?: string;
}) {
  const todayDay = wibDay(nowMs());
  const thisMonth = todayDay.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Math.ceil((lead + days) / 7) * 7;
  const byDay = new Map<string, CalLesson[]>();
  for (const l of lessons) {
    const k = wibDay(l.starts_at);
    byDay.set(k, [...(byDay.get(k) ?? []), l]);
  }
  const inMonth = lessons.filter((l) => wibDay(l.starts_at).startsWith(month));
  const href = (mm: string) => `${basePath}?month=${mm}${extraParams}`;
  const nav = "grid size-11 place-items-center rounded-card border border-border bg-white hover:bg-navy/5";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link scroll={false} href={href(shift(month, -1))} className={nav} aria-label="Previous month"><ChevronLeft className="size-5" /></Link>
        <Link scroll={false} href={href(thisMonth)} className="flex h-11 items-center rounded-card border border-border bg-white px-4 text-sm font-bold hover:bg-navy/5">Today</Link>
        <Link scroll={false} href={href(shift(month, 1))} className={nav} aria-label="Next month"><ChevronRight className="size-5" /></Link>
        <h2 className="ml-2 text-lg font-bold">{monthLabel.format(first)}</h2>
        <span className="ml-auto text-xs text-muted">All times in WIB (UTC+7)</span>
      </div>

      <div className="hidden overflow-hidden rounded-card border border-border bg-white md:block">
        <div className="grid grid-cols-7 bg-navy text-center text-sm font-bold text-white">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: cells }, (_, i) => {
            const n = i - lead + 1;
            const valid = n >= 1 && n <= days;
            const key = valid ? `${month}-${String(n).padStart(2, "0")}` : "";
            return (
              <div key={i} className={`min-h-28 space-y-1 border-b border-r border-border/70 p-1.5 ${valid ? "" : "bg-border/20"}`}>
                {valid && <span className={`inline-grid size-6 place-items-center rounded text-xs font-bold ${key === todayDay ? "bg-navy text-white" : ""}`}>{n}</span>}
                {(byDay.get(key) ?? []).map((l) => <Chip key={l.id} l={l} />)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden">
        {inMonth.length === 0 ? <EmptyState title="No lessons this month">Use the arrows to check another month.</EmptyState> : (
          <ul className="space-y-2">
            {inMonth.map((l) => (
              <li key={l.id} className="rounded-card border border-border bg-white">
                <DetailSheet title={l.title} triggerClassName="block w-full p-3 text-left"
                  trigger={<><span className="block text-xs font-bold text-muted">{wibDate(l.starts_at)}</span>
                    <span className="block font-bold">{l.title}</span>
                    <span className="text-sm text-muted">{wibTime(l.starts_at)} to {wibTime(l.ends_at)} WIB</span></>}>
                  <p className="font-bold">{wibRange(l.starts_at, l.ends_at)}</p>
                  <p className="text-muted">Duration {duration(l.minutes)}</p>
                  {l.detail}
                </DetailSheet>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const currentMonth = (q?: string) => (q && /^\d{4}-\d{2}$/.test(q) ? q : wibDay(nowMs()).slice(0, 7));
