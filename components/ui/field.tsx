import type { ComponentProps, ReactNode } from "react";

export const inputCls =
  "h-12 w-full rounded-card border border-border bg-white px-4 text-navy placeholder:text-muted disabled:bg-border/40";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}
export const Input = (p: ComponentProps<"input">) => <input {...p} className={`${inputCls} ${p.className ?? ""}`} />;
export const Select = (p: ComponentProps<"select">) => <select {...p} className={`${inputCls} ${p.className ?? ""}`} />;
export const Textarea = (p: ComponentProps<"textarea">) => (
  <textarea {...p} className={`${inputCls} h-auto min-h-24 py-3 ${p.className ?? ""}`} />
);
