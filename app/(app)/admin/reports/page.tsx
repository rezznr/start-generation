import { FilterSelect } from "@/components/filter-select";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, ReportStatus, Table, Td, Th } from "@/components/ui/card";
import { DialogForm } from "@/components/ui/dialog-form";
import { approveReport } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { duration, idr, wibRange } from "@/lib/format";

export default async function AdminReports({ searchParams }: PageProps<"/admin/reports">) {
  const status = String((await searchParams).status ?? "pending");
  const { supabase } = await getSession();
  let query = supabase.from("lesson_reports").select(
    "lesson_id, topic, progress, next_steps, status, submitted_at, lesson:lessons(starts_at, ends_at, duration_minutes, class:classes(title, tutor:profiles!classes_tutor_id_fkey(full_name)), rate:lesson_rates(hourly_rate))",
  ).order("submitted_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const rows = ((await query).data ?? []) as any[];
  // The preview calls the same SQL formula that approval uses.
  const previews = await Promise.all(rows.map(async (r) => (await supabase.rpc("preview_earning", { p_lesson_id: r.lesson_id })).data as number));

  return (
    <>
      <PageHeader title="Reports" description="Review tutor reports. Approving records the tutor's earnings once and makes the lesson and report read-only."
        actions={<FilterSelect name="status" label="Filter by status" options={[{ value: "pending", label: "Pending approval" }, { value: "approved", label: "Approved" }, { value: "all", label: "All reports" }]} />} />
      {rows.length === 0 ? <EmptyState title="No reports here">Tutors submit one shared report per finished lesson.</EmptyState> : (
        <Table><thead><tr><Th>Class</Th><Th>Tutor</Th><Th>Lesson</Th><Th>Status</Th><Th right>Earnings</Th><Th /></tr></thead><tbody>
          {rows.map((r, i) => { const l = r.lesson; return (
            <tr key={r.lesson_id}>
              <Td className="font-medium">{l.class.title}</Td><Td>{l.class.tutor?.full_name}</Td>
              <Td>{wibRange(l.starts_at, l.ends_at)}</Td><Td><ReportStatus status={r.status} /></Td>
              <Td right>{idr(previews[i] ?? 0)}</Td>
              <Td right>{r.status === "pending" && (
                <DialogForm trigger="Review" triggerSize="sm" title="Approve report" submit="Approve and record earnings"
                  description="Check the report and the earnings calculation before approving."
                  action={approveReport}>
                  <input type="hidden" name="lesson_id" value={r.lesson_id} />
                  <dl className="space-y-2 text-sm">
                    {[["Class", l.class.title], ["Tutor", l.class.tutor?.full_name], ["Lesson time", wibRange(l.starts_at, l.ends_at)],
                      ["Duration", duration(l.duration_minutes)], ["Topic", r.topic], ["Learning progress", r.progress], ["Next steps", r.next_steps]].map(([k, v]) => (
                      <div key={k}><dt className="text-xs font-bold uppercase text-muted">{k}</dt><dd>{v}</dd></div>))}
                  </dl>
                  <div className="rounded-card bg-warning-tint p-3 text-sm">
                    <p className="font-bold">Earnings preview</p>
                    <p className="tabular-nums">{idr(l.rate?.hourly_rate ?? 0)} per hour (rate snapshot) × {l.duration_minutes} min ÷ 60 = <b>{idr(previews[i] ?? 0)}</b></p>
                    <p className="mt-1 text-xs">Counted once per lesson, not per student. Rounded to the nearest rupiah.</p>
                  </div>
                  <p className="text-xs text-muted">After approval, this lesson and its report can no longer be edited or deleted.</p>
                </DialogForm>)}
                {r.status === "approved" && <Button variant="ghost" size="sm" disabled>Approved</Button>}</Td>
            </tr>); })}
        </tbody></Table>)}
    </>
  );
}
