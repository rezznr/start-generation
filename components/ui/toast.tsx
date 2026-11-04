"use client";

import { CircleX, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Error notification pinned to the top centre. `token` changes on every new result
 * (an action state object), so the same message shows again after another failed try.
 */
export function ErrorToast({ message, token }: { message?: string | null; token: unknown }) {
  const [seen, setSeen] = useState<unknown>(null);
  const [open, setOpen] = useState(false);
  // Derived during render: reopen whenever a new failed result arrives.
  if (token !== seen) { setSeen(token); setOpen(!!message); }

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => setOpen(false), 6000);
    return () => clearTimeout(id);
  }, [open, token]);

  if (!open || !message) return null;
  return (
    <div role="alert" className="fixed left-1/2 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-[sg-toast_220ms_cubic-bezier(0.22,1,0.36,1)] items-start gap-3 rounded-lg border border-destructive/60 bg-destructive-tint py-3 pl-4 pr-2 text-destructive-fg shadow-[0_8px_24px_rgb(16_24_40/0.12)]">
      <CircleX className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <p className="flex-1 text-[15px] font-medium leading-snug">{message}</p>
      <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss" className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-destructive/10"><X className="size-4" /></button>
    </div>
  );
}
