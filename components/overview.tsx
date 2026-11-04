import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

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

export { MiniCalendar } from "@/components/mini-calendar";

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
