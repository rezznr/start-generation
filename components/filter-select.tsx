"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Filters live in the URL so a view can be shared or restored.
export function FilterSelect({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <label className="text-sm font-medium">
      <span className="sr-only">{label}</span>
      <select value={params.get(name) ?? ""} aria-label={label}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set(name, e.target.value); else next.delete(name);
          router.replace(`${path}?${next}`);
        }}
        className="h-11 rounded-card border border-border bg-white px-3 text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
