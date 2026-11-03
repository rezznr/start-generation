import { CapacityIndicator, EmptyState, PageHeader, StatusBadge } from "@/components/ui/card";
import { DialogForm } from "@/components/ui/dialog-form";
import { Input } from "@/components/ui/field";
import { enrollInClass } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { idr } from "@/lib/format";

export default async function Browse({ searchParams }: PageProps<"/student/browse">) {
  const q = String((await searchParams).q ?? "").toLowerCase();
  const { supabase } = await getSession();
  const [catalog, mine] = await Promise.all([supabase.rpc("catalog"), supabase.from("enrollments").select("class_id")]);
  const enrolled = new Set((mine.data ?? []).map((e) => e.class_id));
  const rows = ((catalog.data ?? []) as any[]).filter((c) => `${c.title} ${c.tutor_name} ${c.description}`.toLowerCase().includes(q));

  return (
    <>
      <PageHeader title="Browse Classes" description="Enrolling reserves a seat and issues an invoice. Access opens after an admin confirms your payment." />
      <form className="mb-4 max-w-sm"><Input name="q" defaultValue={q} type="search" placeholder="Search by class or tutor" aria-label="Search classes" /></form>
      {rows.length === 0 ? <EmptyState title="No classes found">{q ? "Try a different keyword." : "No classes are open for enrollment yet."}</EmptyState> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => { const full = c.seats_reserved >= c.capacity; const mineAlready = enrolled.has(c.id); return (
            <article key={c.id} className="flex min-w-0 flex-col rounded-card border border-border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">{c.title}</h2>
              <p className="text-sm text-muted">with {c.tutor_name}</p>
              <p className="mt-3 flex-1 text-sm">{c.description}</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <CapacityIndicator reserved={c.seats_reserved} capacity={c.capacity} />
                <p className="text-xl font-bold tabular-nums">{idr(c.student_price)}</p>
              </div>
              <div className="mt-4">
                {mineAlready ? <StatusBadge tone="success">You are enrolled</StatusBadge>
                : full ? <StatusBadge tone="danger">Class full</StatusBadge>
                : <DialogForm trigger="Enroll now" title={`Enroll in ${c.title}`} submit="Confirm enrollment" action={enrollInClass}
                    description={`This reserves one seat and issues an invoice for ${idr(c.student_price)}. An admin confirms your simulated payment before you get access.`}>
                    <input type="hidden" name="class_id" value={c.id} />
                    <p className="text-sm">Your seat is held while the invoice is unpaid. Reservations do not expire automatically.</p>
                  </DialogForm>}
              </div>
            </article>); })}
        </div>)}
    </>
  );
}
