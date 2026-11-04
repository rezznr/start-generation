import { Children, cloneElement, isValidElement, type ReactNode } from "react";

export function Card({ title, action, children, className = "" }: {
  title?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`sg-rise min-w-0 rounded-card bg-surface p-6 shadow-card ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

// The top bar already names the section, so the h1 stays for screen readers unless a page has its own title.
export function PageHeader({ title, description, actions, showTitle }: { title: string; description?: string; actions?: ReactNode; showTitle?: boolean }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className={showTitle ? "text-2xl font-bold tracking-tight" : "sr-only"}>{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div className="min-w-0 rounded-card bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums break-words">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-muted/50 px-6 py-9 text-center">
      <p className="font-medium text-muted">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted/90">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

const tones = {
  success: "bg-success-tint text-success-fg",
  warning: "bg-warning-tint text-warning-fg",
  danger: "bg-destructive-tint text-destructive-fg",
  neutral: "bg-border/60 text-navy",
} as const;

// Text label plus tone, so status never relies on color alone.
export function StatusBadge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export const InvoiceStatus = ({ status }: { status: string }) =>
  status === "paid" ? <StatusBadge tone="success">Paid</StatusBadge> : <StatusBadge tone="warning">Awaiting Payment</StatusBadge>;

export const ReportStatus = ({ status }: { status?: string | null }) =>
  !status ? <StatusBadge tone="danger">Report missing</StatusBadge>
  : status === "approved" ? <StatusBadge tone="success">Approved</StatusBadge>
  : <StatusBadge tone="warning">Pending approval</StatusBadge>;

export function CapacityIndicator({ reserved, capacity }: { reserved: number; capacity: number }) {
  const full = reserved >= capacity;
  return (
    <div className="min-w-28">
      <p className="text-sm tabular-nums">{reserved}/{capacity} seats{full && " (full)"}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className={`h-full rounded-full transition-[width] duration-200 ${full ? "bg-destructive" : "bg-gold"}`}
          style={{ width: `${Math.min(100, (reserved / capacity) * 100)}%` }} />
      </div>
    </div>
  );
}

const textOf = (n: ReactNode): string => (typeof n === "string" ? n : "");

// Wide screens: a normal table. Phones: every row becomes a card, with each cell labelled by its
// column header (copied from <thead> below), so nothing scrolls sideways or wraps one word per line.
type WithChildren = { children?: ReactNode };

export function Table({ children }: { children: ReactNode }) {
  const parts = Children.toArray(children);
  const head = parts.find((c) => isValidElement<WithChildren>(c) && c.type === "thead");
  const headRow = isValidElement<WithChildren>(head) ? Children.toArray(head.props.children)[0] : null;
  const labels = isValidElement<WithChildren>(headRow)
    ? Children.toArray(headRow.props.children).map((th) => (isValidElement<WithChildren>(th) ? textOf(th.props.children) : ""))
    : [];
  const kids = parts.map((c) => {
    if (!isValidElement<WithChildren>(c) || c.type !== "tbody") return c;
    const rows = Children.toArray(c.props.children).map((tr) => {
      if (!isValidElement<WithChildren>(tr)) return tr;
      const cells = Children.toArray(tr.props.children).map((td, i) =>
        isValidElement<{ label?: string }>(td) && td.type === Td ? cloneElement(td, { label: labels[i] }) : td);
      return cloneElement(tr, undefined, cells);
    });
    return cloneElement(c, undefined, rows);
  });
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
      <table className="w-full text-left text-sm max-md:[&_tbody]:block max-md:[&_thead]:sr-only max-md:[&_tbody_tr]:block max-md:[&_tbody_tr]:space-y-1.5 max-md:[&_tbody_tr]:border-b max-md:[&_tbody_tr]:border-border/70 max-md:[&_tbody_tr]:p-4 max-md:[&_tbody_tr:last-child]:border-b-0">{kids}</table>
    </div>
  );
}
export const Th = ({ children, right }: { children?: ReactNode; right?: boolean }) => (
  <th scope="col" className={`whitespace-nowrap border-b border-border bg-canvas/60 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted ${right ? "text-right" : ""}`}>{children}</th>
);
export const Td = ({ children, right, className = "", label }: { children?: ReactNode; right?: boolean; className?: string; label?: string }) => (
  <td data-label={label || undefined}
    className={`border-b border-border/70 px-4 py-3 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:border-0 max-md:p-0 max-md:before:shrink-0 max-md:before:text-xs max-md:before:font-bold max-md:before:uppercase max-md:before:tracking-wide max-md:before:text-muted max-md:before:content-[attr(data-label)] ${label ? "" : "max-md:justify-end"} ${right ? "text-right tabular-nums" : ""} ${className}`}>
    {label ? <span className="min-w-0 max-md:text-right">{children}</span> : children}
  </td>
);

// Compact metric tile: icon, label, and the value in a soft ring.
export function StatTile({ icon, label, hint, value }: { icon: ReactNode; label: string; hint?: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-card bg-canvas/70 p-4">
      <span className="shrink-0 text-navy">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <span className="grid min-w-10 shrink-0 place-items-center rounded-full border-4 border-success/15 px-2 py-1.5 text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
