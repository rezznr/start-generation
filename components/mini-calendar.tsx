"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { nowMs, wibDay, wibTime } from "@/lib/format";

const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const shift = (ym: string, d: number) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + d, 1)).toISOString().slice(0, 7);
};

type Lesson = { id: string; starts_at: string; ends_at: string; title: string };

// Month and day are client state: the lessons are already on the page, so picking a date must not
// navigate (a navigation re-renders on the server and jumps back to the top on phones).
export function MiniCalendar({ lessons, cal, day }: { lessons: Lesson[]; basePath?: string; cal?: string; day?: string }) {
  const [today] = useState(() => wibDay(nowMs()));
  const [selected, setSelected] = useState(day ?? today);
  const [month, setMonth] = useState(cal && /^\d{4}-\d{2}$/.test(cal) ? cal : (day ?? today).slice(0, 7));
  const [y, m] = month.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Math.ceil((lead + days) / 7) * 7;
  const withLessons = new Set(lessons.map((l) => wibDay(l.starts_at)));
  const arrow = "grid size-9 place-items-center rounded-lg bg-canvas hover:bg-navy/10";
  const dayLessons = lessons.filter((l) => wibDay(l.starts_at) === selected);

  return (
    <>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => setMonth(shift(month, -1))} className={arrow} aria-label="Previous month"><ChevronLeft className="size-5" /></button>
          <h2 className="text-xl font-bold">{monthLabel.format(new Date(Date.UTC(y, m - 1, 1)))}</h2>
          <button type="button" onClick={() => setMonth(shift(month, 1))} className={arrow} aria-label="Next month"><ChevronRight className="size-5" /></button>
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
              <button key={key} type="button" onClick={() => { setSelected(key); setMonth(key.startsWith(month) ? month : key.slice(0, 7)); }} aria-label={key} aria-current={isToday ? "date" : undefined}
                className={`mx-auto grid size-10 place-items-center rounded-full text-[15px] ${isSel ? "bg-navy font-medium text-white" : isToday ? "bg-gold-soft font-medium" : "hover:bg-navy/[0.06]"} ${!inMonth && !isSel && !isToday ? "text-muted/60" : ""}`}>
                <span className="relative">{date.getUTCDate()}
                  {withLessons.has(key) && <span className={`absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full ${isSel ? "bg-gold" : "bg-gold-hover"}`} aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Schedule</h2>
          <button type="button" onClick={() => { setSelected(today); setMonth(today.slice(0, 7)); }} className="text-sm font-medium text-muted hover:text-navy">Today</button>
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

