import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { idr } from "@/lib/format";

export default async function TutorClasses() {
  const { supabase } = await getSession();
  const { data } = await supabase.from("classes").select("id, title, description, capacity, rate:class_tutor_rates(hourly_rate)").order("created_at");
  const rows = (data ?? []) as any[];
  // Enrolled count comes from a function that returns a number only, never billing rows.
  const counts = await Promise.all(rows.map(async (c) => (await supabase.rpc("class_enrolled_count", { p_class_id: c.id })).data as number));

  return (
    <>
      <PageHeader title="My Classes" description="Classes assigned to you by the admin." />
      {rows.length === 0 ? <EmptyState title="No classes assigned yet">An admin assigns classes to you. Once one is assigned it will show up here with its roster size.</EmptyState> : (
        <Table><thead><tr><Th>Class</Th><Th right>Enrolled students</Th><Th right>Your hourly rate</Th></tr></thead><tbody>
          {rows.map((c, i) => <tr key={c.id}><Td><b>{c.title}</b><br /><span className="text-muted">{c.description}</span></Td>
            <Td right>{counts[i]}/{c.capacity}</Td><Td right>{idr(c.rate?.hourly_rate ?? 0)}</Td></tr>)}
        </tbody></Table>)}
    </>
  );
}
