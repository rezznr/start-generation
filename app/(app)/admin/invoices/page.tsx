import { FilterSelect } from "@/components/filter-select";
import { EmptyState, InvoiceStatus, PageHeader, Table, Td, Th } from "@/components/ui/card";
import { DialogForm } from "@/components/ui/dialog-form";
import { Field, Input } from "@/components/ui/field";
import { markPaid } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { idr, wibDateTime } from "@/lib/format";

export default async function AdminInvoices({ searchParams }: PageProps<"/admin/invoices">) {
  const status = String((await searchParams).status ?? "");
  const { supabase } = await getSession();
  let query = supabase.from("invoices").select("id, amount, status, paid_at, payment_ref, created_at, class:classes(title), student:profiles!invoices_student_id_fkey(full_name)").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const rows = ((await query).data ?? []) as any[];

  return (
    <>
      <PageHeader title="Invoices" description="Payments are simulated. Confirming one here unlocks the student's schedule and reports."
        actions={<FilterSelect name="status" label="Filter by status" options={[{ value: "", label: "All invoices" }, { value: "unpaid", label: "Awaiting Payment" }, { value: "paid", label: "Paid" }]} />} />
      {rows.length === 0 ? <EmptyState title="No invoices match">Invoices are created automatically when a student enrolls.</EmptyState> : (
        <Table><thead><tr><Th>Student</Th><Th>Class</Th><Th right>Amount</Th><Th>Status</Th><Th>Paid</Th><Th /></tr></thead><tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <Td className="font-medium">{i.student?.full_name}</Td><Td>{i.class?.title}</Td><Td right>{idr(i.amount)}</Td>
              <Td><InvoiceStatus status={i.status} /></Td>
              <Td className="text-muted">{i.paid_at ? <>{wibDateTime(i.paid_at)}{i.payment_ref && <><br />{i.payment_ref}</>}</> : "Not paid"}</Td>
              <Td right>{i.status === "unpaid" && (
                <DialogForm trigger="Mark as Paid" triggerSize="sm" title="Mark invoice as paid"
                  description={`Confirm that ${i.student?.full_name} has paid ${idr(i.amount)} for ${i.class?.title}. This unlocks their schedule and approved reports.`}
                  submit="Confirm payment" action={markPaid}>
                  <input type="hidden" name="invoice_id" value={i.id} />
                  <Field label="Payment reference (optional)" hint="A note for your records, for example a transfer reference."><Input name="ref" autoFocus /></Field>
                </DialogForm>)}</Td>
            </tr>))}
        </tbody></Table>)}
    </>
  );
}
