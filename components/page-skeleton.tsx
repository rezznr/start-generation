import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the dashboard layout so the page does not jump when data arrives.
export function PageSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]" role="status" aria-label="Loading">
      <div className="space-y-5">
        <div className="banner-gold h-28 rounded-card"><div className="space-y-3 p-7"><Skeleton className="h-6 w-56 bg-white/40" /><Skeleton className="h-4 w-80 bg-white/40" /></div></div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4 rounded-card bg-surface p-6 shadow-card">
            <div className="flex justify-between"><Skeleton className="h-6 w-40" /><Skeleton className="h-5 w-16" /></div>
            <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((j) => <Skeleton key={j} className="h-24" />)}</div>
          </div>))}
      </div>
      <div className="space-y-5">
        <div className="space-y-3 rounded-card bg-surface p-6 shadow-card">
          <div className="flex justify-between"><Skeleton className="size-9" /><Skeleton className="h-6 w-36" /><Skeleton className="size-9" /></div>
          <div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="mx-auto size-9 rounded-full" />)}</div>
          <Skeleton className="h-20" />
        </div>
        <div className="space-y-3 rounded-card bg-surface p-6 shadow-card"><Skeleton className="h-6 w-20" /><Skeleton className="h-16" /></div>
      </div>
    </div>
  );
}

const card = "rounded-card bg-surface p-6 shadow-card";
const Toolbar = () => <div className="flex items-center justify-between gap-3"><Skeleton className="h-7 w-48" /><Skeleton className="h-11 w-28" /></div>;

// Tables: invoices, reports, earnings.
export function ListSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <div className={`${card} space-y-4`}>
        <Toolbar />
        <Skeleton className="h-10" />
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="size-9 shrink-0 rounded-full" /><Skeleton className="h-5 flex-1" /><Skeleton className="hidden h-5 w-24 sm:block" /><Skeleton className="h-8 w-20" /></div>)}
      </div>
    </div>
  );
}

// Class cards: classes, browse.
export function CardsSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className="flex items-center justify-between"><Skeleton className="h-7 w-40" /><Skeleton className="h-11 w-32" /></div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${card} space-y-4`}>
            <Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-24" /></div>
            <Skeleton className="h-2 w-full" /><Skeleton className="h-11 w-full" />
          </div>))}
      </div>
    </div>
  );
}

// Weekly schedule / lesson list.
export function ScheduleSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className="flex items-center justify-between"><Skeleton className="h-7 w-44" /><Skeleton className="h-11 w-28" /></div>
      {[0, 1].map((d) => (
        <div key={d} className={`${card} space-y-3`}>
          <Skeleton className="h-5 w-40" />
          {[0, 1].map((i) => <div key={i} className="flex items-center gap-4 rounded-lg border border-border/60 p-4"><Skeleton className="h-12 w-20 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3" /></div><Skeleton className="h-8 w-24" /></div>)}
        </div>))}
    </div>
  );
}

// Class detail with tabs.
export function DetailSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className={`${card} space-y-3`}><Skeleton className="h-8 w-72" /><Skeleton className="h-4 w-96 max-w-full" /><div className="flex gap-2 pt-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-28" /></div></div>
      <div className="flex gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-28" />)}</div>
      <div className={`${card} space-y-3`}>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
    </div>
  );
}
