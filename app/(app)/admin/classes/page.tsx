import Link from "next/link";
import { ClassForm } from "@/components/class-form";
import { EmptyState, PageHeader, CapacityIndicator, Table, Td, Th } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { getSession } from "@/lib/auth";
import { idr } from "@/lib/format";

export default async function AdminClasses({ searchParams }: PageProps<"/admin/classes">) {
  const q = String((await searchParams).q ?? "").toLowerCase();
  const { supabase } = await getSession();
  const [classes, prices, rates, enrollments, tutors] = await Promise.all([
    supabase.from("classes").select("id, title, tutor:profiles!classes_tutor_id_fkey(full_name), capacity").order("created_at"),
    supabase.from("class_student_pricing").select("*"),
    supabase.from("class_tutor_rates").select("*"),
    supabase.from("enrollments").select("class_id"),
    supabase.from("profiles").select("id, full_name").eq("role", "tutor"),
  ]);
  const rows = ((classes.data ?? []) as any[]).filter((c) => `${c.title} ${c.tutor?.full_name}`.toLowerCase().includes(q));
  const find = (list: any[] | null, id: string) => list?.find((x) => x.class_id === id);

  return (
    <>
      <PageHeader title="Classes" description="Create classes, set capacity and assign tutors."
        actions={<ClassForm tutors={tutors.data ?? []} />} />
      <form className="mb-4 max-w-sm"><Input name="q" defaultValue={q} placeholder="Search by class or tutor" aria-label="Search classes" type="search" /></form>
      {rows.length === 0 ? <EmptyState title={q ? "No classes match your search" : "No classes yet"}>{q ? "Try a different keyword." : "Create the first class to start taking enrollments."}</EmptyState> : (
        <Table>
          <thead><tr><Th>Class</Th><Th>Tutor</Th><Th>Seats</Th><Th right>Student price</Th><Th right>Tutor rate / hour</Th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id}>
              <Td><Link href={`/admin/classes/${c.id}`} className="font-bold underline-offset-2 hover:underline">{c.title}</Link></Td>
              <Td>{c.tutor?.full_name}</Td>
              <Td><CapacityIndicator reserved={enrollments.data?.filter((e) => e.class_id === c.id).length ?? 0} capacity={c.capacity} /></Td>
              <Td right>{idr(find(prices.data, c.id)?.student_price ?? 0)}</Td>
              <Td right>{idr(find(rates.data, c.id)?.hourly_rate ?? 0)}</Td>
            </tr>))}
          </tbody>
        </Table>
      )}
    </>
  );
}
