"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check, ListFilter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Filters live in the URL so a view can be shared or restored. One group, pick one option.
export function FilterSelect({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const value = params.get(name) ?? options[0].value;
  const set = (v: string) => {
    const next = new URLSearchParams(params);
    if (v && v !== options[0].value) next.set(name, v); else next.delete(name);
    router.replace(`${path}?${next}`);
  };
  const active = value !== options[0].value;

  return (
    <Menu.Root>
      <Menu.Trigger aria-label={label}
        className="flex h-11 items-center gap-2 rounded-lg border border-border bg-canvas/60 px-4 text-[15px] font-medium shadow-[0_1px_2px_rgb(16_24_40/0.04)] outline-none hover:bg-navy/[0.04] focus-visible:ring-2 focus-visible:ring-navy">
        <ListFilter className="size-[18px]" strokeWidth={1.75} aria-hidden />
        Filter
        {active && <span className="size-2 rounded-full bg-gold" aria-hidden />}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={6}
          className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-5 shadow-[0_8px_24px_rgb(16_24_40/0.10)] data-[state=open]:animate-[sg-fade_120ms_ease-out]">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <p className="font-bold">Filter</p>
            <Menu.Item onSelect={() => set("")} className="cursor-pointer rounded px-1 text-sm font-medium text-muted outline-none data-[highlighted]:text-navy">Clear All</Menu.Item>
          </div>
          <p className="pb-2 pt-4 font-bold">{label.replace(/^Filter by /, "").replace(/^./, (c) => c.toUpperCase())}</p>
          <Menu.RadioGroup value={value} onValueChange={set}>
            {options.map((o) => (
              <Menu.RadioItem key={o.value} value={o.value} onSelect={(e) => e.preventDefault()}
                className="group flex h-10 cursor-pointer items-center gap-3 rounded-md outline-none data-[highlighted]:bg-navy/[0.04]">
                <span className="grid size-[22px] place-items-center rounded-md border-2 border-navy text-navy group-data-[state=checked]:bg-navy group-data-[state=checked]:text-white">
                  <Menu.ItemIndicator><Check className="size-3.5" strokeWidth={3} aria-hidden /></Menu.ItemIndicator>
                </span>
                {o.label}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
