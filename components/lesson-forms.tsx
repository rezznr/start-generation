import { DialogForm } from "@/components/ui/dialog-form";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { deleteLesson, saveLesson, saveReport } from "@/lib/actions";
import { toWibInput } from "@/lib/format";

export function LessonForm({ classes, lesson }: {
  classes: { id: string; title: string }[];
  lesson?: { id: string; class_id: string; starts_at: string; ends_at: string };
}) {
  return (
    <DialogForm trigger={lesson ? "Edit" : "Schedule lesson"} triggerSize={lesson ? "sm" : "md"} triggerVariant={lesson ? "outline" : "primary"}
      title={lesson ? "Edit lesson" : "Schedule lesson"} submit={lesson ? "Save lesson" : "Schedule lesson"}
      description="Times are entered in WIB (UTC+7). Your lessons cannot overlap across classes." action={saveLesson}>
      {lesson && <input type="hidden" name="id" value={lesson.id} />}
      <Field label="Class">
        {lesson && <input type="hidden" name="class_id" value={lesson.class_id} />}
        <Select name="class_id" defaultValue={lesson?.class_id ?? ""} required disabled={!!lesson}>
          <option value="" disabled>Choose a class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </Select>
      </Field>
      <Field label="Starts (WIB)"><Input name="starts" type="datetime-local" required defaultValue={lesson && toWibInput(lesson.starts_at)} /></Field>
      <Field label="Ends (WIB)" hint="The end time must be after the start. A lesson may start exactly when another ends.">
        <Input name="ends" type="datetime-local" required defaultValue={lesson && toWibInput(lesson.ends_at)} />
      </Field>
    </DialogForm>
  );
}

export function DeleteLesson({ id }: { id: string }) {
  return (
    <DialogForm trigger="Delete" triggerSize="sm" triggerVariant="ghost" danger title="Delete lesson" submit="Delete lesson"
      description="This removes the lesson from the schedule. Approved lessons cannot be deleted." action={deleteLesson}>
      <input type="hidden" name="lesson_id" value={id} />
    </DialogForm>
  );
}

export function ReportForm({ lessonId, report }: { lessonId: string; report?: { topic: string; progress: string; next_steps: string } | null }) {
  return (
    <DialogForm trigger={report ? "Edit report" : "Submit report"} triggerSize="sm" triggerVariant={report ? "outline" : "primary"}
      title={report ? "Edit report" : "Submit lesson report"} submit={report ? "Save report" : "Submit report"}
      description="One shared report covers the whole group. An admin approves it before students can read it." action={saveReport}>
      <input type="hidden" name="lesson_id" value={lessonId} />
      <Field label="Topic"><Input name="topic" defaultValue={report?.topic} required autoFocus /></Field>
      <Field label="Learning progress"><Textarea name="progress" defaultValue={report?.progress} required /></Field>
      <Field label="Next steps"><Textarea name="next_steps" defaultValue={report?.next_steps} required /></Field>
    </DialogForm>
  );
}
