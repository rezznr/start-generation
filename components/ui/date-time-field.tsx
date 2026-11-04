"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { useMarkDirty } from "@/components/ui/dialog-form";
import { inputCls } from "@/components/ui/field";
import { nowMs, wibDay } from "@/lib/format";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const shown = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const shift = (ym: string, by: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

/** Date and time picker built for the design system. Submits "YYYY-MM-DDTHH:mm" (WIB) under `name`. */
// It labels itself (aria-labelledby) instead of sitting inside a <label>, so clicks in the panel never toggle it.
export function DateTimeField({ label, hint, name, defaultValue = "" }: { label: string; hint?: string; name: string; defaultValue?: string }) {
  const labelId = useId();
  const markDirty = useMarkDirty();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (defaultValue || wibDay(nowMs())).slice(0, 7));

  const [date, time = "09:00"] = value ? value.split("T") : [];
  const [hh, mm] = time.split(":");
  const set = (d: string, t: string) => { setValue(`${d}T${t}`); markDirty(); };

  const today = open ? wibDay(nowMs()) : "";
  const [y, m] = month.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells = Math.ceil((lead + new Date(Date.UTC(y, m, 0)).getUTCDate()) / 7) * 7;
  const arrow = "grid size-9 place-items-center rounded-lg bg-canvas hover:bg-navy/10";
  const col = (items: string[], current: string | undefined, label: string, pick: (v: string) => void) => (
    <div role="group" aria-label={label} className="h-56 w-16 overflow-y-auto pr-1">
      {(current && !items.includes(current) ? [...items, current].sort() : items).map((v) => (
        <button key={v} type="button" aria-label={`${label} ${v}`} aria-pressed={v === current} onClick={() => pick(v)}
          ref={(el) => { if (el && v === current && el.parentElement) el.parentElement.scrollTop = el.offsetTop - 90; }}
          className={`mb-1 grid h-9 w-full place-items-center rounded-lg text-sm ${v === current ? "bg-navy font-medium text-white" : "hover:bg-navy/[0.06]"}`}>{v}</button>
      ))}
    </div>
  );

  return (
    <div className="text-sm font-medium">
      <span id={labelId}>{label}</span>
      <input type="hidden" name={name} value={value} />
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-labelledby={labelId}

        className={`${inputCls} mt-1 flex items-center justify-between text-left font-normal ${value ? "" : "text-muted"}`}>
        <span>{value ? `${shown.format(new Date(`${date}T00:00:00Z`))}, ${hh}:${mm}` : "Select date and time"}</span>
        <CalendarDays className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div className="mt-2 animate-[sg-fade_120ms_ease-out] rounded-lg border border-border bg-surface p-4 shadow-[0_8px_24px_rgb(16_24_40/0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setMonth(shift(month, -1))} className={arrow} aria-label="Previous month"><ChevronLeft className="size-5" /></button>
                <span className="font-bold">{monthFmt.format(new Date(Date.UTC(y, m - 1, 1)))}</span>
                <button type="button" onClick={() => setMonth(shift(month, 1))} className={arrow} aria-label="Next month"><ChevronRight className="size-5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="py-1 text-xs font-medium text-muted">{d}</span>)}
                {Array.from({ length: cells }, (_, i) => {
                  const dt = new Date(Date.UTC(y, m - 1, i - lead + 1));
                  const key = dt.toISOString().slice(0, 10);
                  const sel = key === date;
                  return (
                    <button key={key} type="button" aria-label={key} aria-pressed={sel} onClick={() => { set(key, time); setMonth(key.slice(0, 7)); }}
                      className={`mx-auto grid size-9 place-items-center rounded-full text-sm ${sel ? "bg-navy font-medium text-white" : key === today ? "bg-gold-soft font-medium" : "hover:bg-navy/[0.06]"} ${!key.startsWith(month) && !sel ? "text-muted/60" : ""}`}>
                      {dt.getUTCDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 sm:border-l sm:border-border sm:pl-4">
              {col(HOURS, hh, "Hour", (v) => set(date ?? today, `${v}:${mm ?? "00"}`))}
              {col(MINUTES, mm, "Minute", (v) => set(date ?? today, `${hh ?? "09"}:${v}`))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
            <button type="button" onClick={() => { setValue(""); markDirty(); }} className="rounded px-2 py-1 text-muted hover:text-navy">Clear</button>
            <div className="flex gap-1">
              <button type="button" onClick={() => { set(today, time); setMonth(today.slice(0, 7)); }} className="rounded px-2 py-1 text-muted hover:text-navy">Today</button>
              <button type="button" onClick={() => setOpen(false)} className="rounded px-3 py-1 font-bold text-navy hover:bg-navy/[0.06]">Done</button>
            </div>
          </div>
        </div>
      )}
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </div>
  );
}
