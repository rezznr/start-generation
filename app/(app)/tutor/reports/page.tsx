import { ReportForm } from "@/components/lesson-forms";
import { EmptyState, PageHeader, ReportStatus, Table, Td, Th } from "@/components/ui/card";
import { nowMs, wibRange } from "@/lib/format";
import { tutorLessons } from "@/lib/tutor-data";

export default async function TutorReports() {
  const now = nowMs();
  const ended = (await tutorLessons()).filter((l) => new Date(l.ends_at).getTime() <= now).reverse();
  return (
    <>
      <PageHeader title="Reports" description="Submit one shared report per finished lesson. You can edit it until an admin approves it." />
      {ended.length === 0 ? <EmptyState title="No finished lessons yet">Once a lesson ends you can submit its report here.</EmptyState> : (
        <Table><thead><tr><Th>Class</Th><Th>Lesson</Th><Th>Status</Th><Th /></tr></thead><tbody>
          {ended.map((l) => (
            <tr key={l.id}><Td className="font-medium">{l.class.title}</Td><Td>{wibRange(l.starts_at, l.ends_at)}</Td><Td><ReportStatus status={l.report?.status} /></Td>
              <Td right>{l.report?.status !== "approved" && <ReportForm lessonId={l.id} report={l.report} />}</Td></tr>))}
        </tbody></Table>)}
    </>
  );
}
