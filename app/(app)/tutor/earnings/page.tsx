import { EmptyState, PageHeader, StatCard, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { duration, idr, wibDateTime } from "@/lib/format";

export default async function TutorEarnings() {
  const { supabase } = await getSession();
  const rows = ((await supabase.from("tutor_earnings").select("id, duration_minutes, hourly_rate, amount, approved_at, lesson:lessons(class:classes(title))").order("approved_at", { ascending: false })).data ?? []) as any[];
  return (
    <>
      <PageHeader title="Earnings" description="Recorded once per lesson when its report is approved. The group size does not change the amount." />
      <div className="mb-6 max-w-sm"><StatCard label="Total approved earnings" value={idr(rows.reduce((a, r) => a + r.amount, 0))} hint="Sum of the entries below." /></div>
      {rows.length === 0 ? <EmptyState title="No earnings yet">Earnings appear after an admin approves one of your reports.</EmptyState> : (
        <Table><thead><tr><Th>Class</Th><Th>Approved</Th><Th>Calculation</Th><Th right>Amount</Th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}><Td className="font-medium">{r.lesson?.class?.title}</Td><Td>{wibDateTime(r.approved_at)}</Td>
            <Td className="tabular-nums text-muted">{r.duration_minutes} min × {idr(r.hourly_rate)}/h ÷ 60 ({duration(r.duration_minutes)})</Td><Td right className="font-bold">{idr(r.amount)}</Td></tr>)}
        </tbody></Table>)}
    </>
  );
}
