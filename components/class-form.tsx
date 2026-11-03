import { DialogForm } from "@/components/ui/dialog-form";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveClass } from "@/lib/actions";

type Cls = { id: string; title: string; description: string; capacity: number; tutor_id: string; student_price: number; tutor_rate: number };

export function ClassForm({ tutors, cls, tutorLocked }: { tutors: { id: string; full_name: string }[]; cls?: Cls; tutorLocked?: boolean }) {
  return (
    <DialogForm trigger={cls ? "Edit class" : "Create class"} triggerVariant={cls ? "outline" : "primary"}
      triggerSize="md"
      title={cls ? "Edit class" : "Create class"} submit={cls ? "Save changes" : "Create class"}
      description="Student price is charged once per student. Tutor rate is paid per lesson hour." action={saveClass}>
      {cls && <input type="hidden" name="id" value={cls.id} />}
      <Field label="Title"><Input name="title" defaultValue={cls?.title} required autoFocus /></Field>
      <Field label="Description"><Textarea name="description" defaultValue={cls?.description} /></Field>
      <Field label="Capacity" hint="Cannot be lower than the seats already reserved.">
        <Input name="capacity" type="number" min={1} defaultValue={cls?.capacity ?? 10} required />
      </Field>
      <Field label="Tutor" hint={tutorLocked ? "Locked because this class already has lessons." : undefined}>
        {tutorLocked && <input type="hidden" name="tutor_id" value={cls?.tutor_id} />}
        <Select name="tutor_id" defaultValue={cls?.tutor_id ?? ""} required disabled={tutorLocked}>
          <option value="" disabled>Choose a tutor</option>
          {tutors.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </Select>
      </Field>
      <Field label="Student price (IDR)" hint="One-time fee a student pays for access to this class.">
        <Input name="student_price" type="number" min={0} defaultValue={cls?.student_price} required />
      </Field>
      <Field label="Tutor hourly rate (IDR)" hint="Paid to the tutor per lesson hour. Copied onto each lesson when it is created.">
        <Input name="tutor_rate" type="number" min={0} defaultValue={cls?.tutor_rate} required />
      </Field>
    </DialogForm>
  );
}
