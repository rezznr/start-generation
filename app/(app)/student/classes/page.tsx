import { Button } from "@/components/ui/button";
import { EmptyState, InvoiceStatus, PageHeader, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { idr } from "@/lib/format";

export default async function MyClasses() {
  const { supabase } = await getSession();
  const rows = ((await supabase.from("invoices").select("id, amount, status, class:classes(id, title, tutor:profiles!classes_tutor_id_fkey(full_name))").order("created_at")).data ?? []) as any[];
  return (
    <>
      <PageHeader title="My Classes" description="Paid classes open your schedule and approved reports." />
      {rows.length === 0 ? <EmptyState title="You have not enrolled yet" action={<Button href="/student/browse">Browse classes</Button>}>Pick a class to reserve a seat.</EmptyState> : (
        <Table><thead><tr><Th>Class</Th><Th>Tutor</Th><Th>Status</Th><Th /></tr></thead><tbody>
          {rows.map((i) => (
            <tr key={i.id}><Td className="font-medium">{i.class.title}</Td><Td>{i.class.tutor?.full_name}</Td><Td><InvoiceStatus status={i.status} /></Td>
              <Td right>{i.status === "paid"
                ? <Button href={`/student/classes/${i.class.id}`} size="sm">Open class</Button>
                : <span className="inline-flex flex-col items-end gap-1"><Button href="/student/invoices" size="sm" variant="outline">Open invoice {idr(i.amount)}</Button>
                  <span className="max-w-60 text-xs text-muted">An admin confirms your simulated payment to unlock this class.</span></span>}</Td></tr>))}
        </tbody></Table>)}
    </>
  );
}
