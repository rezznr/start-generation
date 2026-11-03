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
