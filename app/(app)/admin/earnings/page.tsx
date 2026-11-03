import { EmptyState, PageHeader, StatCard, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { duration, idr, wibDateTime } from "@/lib/format";

export default async function AdminEarnings() {
  const { supabase } = await getSession();
  const rows = ((await supabase.from("tutor_earnings").select("id, duration_minutes, hourly_rate, amount, approved_at, tutor:profiles!tutor_earnings_tutor_id_fkey(full_name), lesson:lessons(class:classes(title))").order("approved_at", { ascending: false })).data ?? []) as any[];

  return (
    <>
      <PageHeader title="Tutor earnings" description="Entries recorded when reports were approved. Pending previews are not included here." />
      <div className="mb-6 max-w-sm"><StatCard label="Total approved" value={idr(rows.reduce((a, r) => a + r.amount, 0))} hint="Sum of all recorded earnings." /></div>
      {rows.length === 0 ? <EmptyState title="No earnings recorded">Approve a pending report to record the first entry.</EmptyState> : (
        <Table><thead><tr><Th>Tutor</Th><Th>Class</Th><Th>Approved</Th><Th>Calculation</Th><Th right>Amount</Th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}><Td className="font-medium">{r.tutor?.full_name}</Td><Td>{r.lesson?.class?.title}</Td><Td>{wibDateTime(r.approved_at)}</Td>
            <Td className="tabular-nums text-muted">{duration(r.duration_minutes)} × {idr(r.hourly_rate)}/h</Td><Td right className="font-bold">{idr(r.amount)}</Td></tr>)}
        </tbody></Table>)}
    </>
  );
}
