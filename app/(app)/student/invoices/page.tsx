import { EmptyState, InvoiceStatus, PageHeader, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { idr, wibDateTime } from "@/lib/format";

export default async function MyInvoices() {
  const { supabase } = await getSession();
  const rows = ((await supabase.from("invoices").select("id, amount, status, created_at, paid_at, class:classes(title)").order("created_at", { ascending: false })).data ?? []) as any[];
  const unpaid = rows.some((r) => r.status === "unpaid");
  return (
    <>
      <PageHeader title="My Invoices" description="The amount was fixed when you enrolled, so later price changes do not affect it." />
      {unpaid && <p className="mb-4 rounded-card bg-warning-tint p-4 text-sm text-warning-fg">Payment is simulated in this demo. Ask an admin to confirm your payment. Your class unlocks as soon as they do.</p>}
      {rows.length === 0 ? <EmptyState title="No invoices yet">An invoice is issued the moment you enroll in a class.</EmptyState> : (
        <Table><thead><tr><Th>Class</Th><Th>Issued</Th><Th right>Amount</Th><Th>Status</Th></tr></thead><tbody>
          {rows.map((i) => <tr key={i.id}><Td className="font-medium">{i.class.title}</Td><Td>{wibDateTime(i.created_at)}</Td><Td right>{idr(i.amount)}</Td>
            <Td><InvoiceStatus status={i.status} />{i.paid_at && <span className="ml-2 text-xs text-muted">{wibDateTime(i.paid_at)}</span>}</Td></tr>)}
        </tbody></Table>)}
    </>
  );
}
