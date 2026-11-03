"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { State } from "@/lib/actions";

type Props = {
  trigger: string;
  triggerVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  triggerSize?: "sm" | "md";
  title: string;
  description: string;
  submit: string;
  action: (s: State, f: FormData) => Promise<State>;
  children?: ReactNode;
  danger?: boolean;
};

// Modal on desktop, bottom sheet on small screens. Radix provides the focus trap,
// focus restoration and Escape handling. Errors stay inside the form; nothing is toast-only.
export function DialogForm({ trigger, triggerVariant = "primary", triggerSize = "md", title, description, submit, action, children, danger }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);

  // Close once the action reports success. Derived during render, so no effect is needed.
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) { setOpen(false); setDirty(false); }
  }

  const onOpenChange = (next: boolean) => {
    if (!next && dirty && !window.confirm("Discard your unsaved changes?")) return;
    if (!next) setDirty(false);
    setOpen(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant={triggerVariant} size={triggerSize} type="button">{trigger}</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-navy/50 data-[state=open]:animate-[sg-fade_150ms_ease-out]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-xl bg-white shadow-xl outline-none data-[state=open]:animate-[sg-sheet_180ms_ease-out] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:data-[state=open]:animate-[sg-pop_180ms_ease-out]">
          <header className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div>
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
            </div>
            <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-navy/10" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </header>
          <form action={formAction} onChange={() => setDirty(true)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {children}
              {state?.error && <p role="alert" className="rounded-card bg-destructive-tint p-3 text-sm font-medium text-destructive-fg">{state.error}</p>}
            </div>
            <footer className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" loading={pending} variant={danger ? "danger" : "primary"}>{submit}</Button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Read-only quick view. Deep information lives on the detail pages.
export function DetailSheet({ trigger, title, children, triggerClassName = "" }: {
  trigger: ReactNode; title: string; children: ReactNode; triggerClassName?: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={triggerClassName}>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-navy/50" />
        <Dialog.Content className="fixed bottom-0 right-0 z-50 flex max-h-[85dvh] w-full flex-col rounded-t-xl bg-white shadow-xl outline-none data-[state=open]:animate-[sg-sheet_180ms_ease-out] sm:inset-y-0 sm:max-h-none sm:max-w-md sm:rounded-none sm:data-[state=open]:animate-[sg-slide_180ms_ease-out]">
          <header className="flex items-center justify-between border-b border-border p-5">
            <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
            <Dialog.Close className="grid size-11 place-items-center rounded-full hover:bg-navy/10" aria-label="Close"><X className="size-5" /></Dialog.Close>
          </header>
          <Dialog.Description className="sr-only">Details for {title}</Dialog.Description>
          <div className="space-y-3 overflow-y-auto p-5 text-sm">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
