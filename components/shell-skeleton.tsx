import Image from "next/image";
import { PageSkeleton } from "@/components/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Same footprint as AppFrame, shown while the session and role are resolved.
// The logo is static, so the sidebar already looks real and the swap to the live frame does not flash.
export function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="hidden w-72 shrink-0 bg-navy md:block" aria-hidden>
        <div className="flex h-[72px] items-center px-5">
          <Image src="/stargeneration-logo.webp" alt="" width={800} height={116} className="h-auto w-[220px]" priority />
        </div>
        <div className="space-y-2 px-4 pt-2">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full !bg-white/10" />)}
        </div>
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
