import { PageSkeleton } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Shown right after login while the session and role are resolved: full shell, then content.
export default function Loading() {
  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="hidden w-72 shrink-0 space-y-3 bg-navy p-4 md:block" aria-hidden>
        <Skeleton className="mb-6 h-10 w-48 !bg-white/15" />
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full !bg-white/10" />)}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-[72px] items-center gap-4 border-b border-border bg-surface px-5" aria-hidden>
          <Skeleton className="size-11" /><Skeleton className="hidden size-12 sm:block" /><Skeleton className="h-9 w-56" />
          <Skeleton className="ml-auto h-10 w-40" />
        </header>
        <main className="p-4 sm:p-6"><PageSkeleton /></main>
      </div>
    </div>
  );
}
