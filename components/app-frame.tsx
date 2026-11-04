"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, ChevronDown, Clock, FileText, LayoutGrid, LogOut, Menu as MenuIcon, PanelLeft, Receipt, Search, Star, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const icons = { layout: LayoutGrid, star: Star, receipt: Receipt, file: FileText, wallet: Wallet, calendar: Calendar, search: Search };
type Item = { href: string; label: string; icon: string; subtitle: string };
type Props = { items: Item[]; name: string; role: string; signOut: () => Promise<void>; children: ReactNode };

const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });

const isActive = (items: Item[], href: string, path: string) => (href === items[0].href ? path === href : path.startsWith(href));

// Highlight the clicked item at once; the real path takes over when navigation lands.
function Links({ items, collapsed, onNavigate, pending, onPick }: { items: Item[]; collapsed: boolean; onNavigate?: () => void; pending: string | null; onPick: (href: string) => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="space-y-2">
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon as keyof typeof icons];
        // The first item is the role home, so it only matches exactly.
        const active = pending ? href === pending : isActive(items, href, path);
        return (
          <Link key={href} href={href} onClick={() => { onPick(href); onNavigate?.(); }} title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={`flex h-12 items-center gap-3.5 rounded-lg px-4 font-medium transition-colors duration-100 ${active ? "bg-gold text-navy" : "text-white hover:bg-white/10"} ${collapsed ? "justify-center px-0" : ""}`}>
            <Icon className="size-[22px] shrink-0" strokeWidth={1.75} aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={`flex h-[72px] items-center gap-3 px-5 ${collapsed ? "justify-center px-0" : ""}`}>
      {collapsed
        ? <Image src="/star.png" alt="Star Generation" width={40} height={40} className="size-10 shrink-0" />
        : <Image src="/stargeneration-logo.webp" alt="Star Generation" width={800} height={116} className="h-auto w-[220px]" priority />}
    </div>
  );
}

const initials = (n: string) => n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function UserMenu({ name, role, signOut }: { name: string; role: string; signOut: () => Promise<void> }) {
  const item = "flex h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-[15px] outline-none data-[highlighted]:bg-navy/[0.06]";
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Menu.Root>
      <form ref={formRef} action={signOut} hidden />
      <Menu.Trigger className="flex items-center gap-3 rounded-lg p-1.5 text-left hover:bg-navy/[0.04]" aria-label="Account menu">
        <span className="grid size-10 place-items-center rounded-full bg-gold-soft/70 text-sm font-bold text-navy">{initials(name)}</span>
        <span className="hidden sm:block">
          <span className="block text-sm font-bold leading-tight">{name}</span>
          <span className="block text-xs capitalize text-muted">{role}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted sm:block" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={8}
          className="z-50 w-72 rounded-lg border border-border bg-surface p-1.5 shadow-[0_8px_24px_rgb(16_24_40/0.10)] data-[state=open]:animate-[sg-fade_120ms_ease-out]">
          <div className="flex items-center gap-3 border-b border-border/70 px-3 pb-3 pt-2">
            <span className="grid size-11 place-items-center rounded-full bg-gold-soft/70 font-bold text-navy">{initials(name)}</span>
            <div className="min-w-0"><p className="truncate font-bold">{name}</p><p className="text-sm capitalize text-muted">{role}</p></div>
          </div>
          {/* The menu unmounts on select, which dropped a submit button inside it, so the form lives outside. */}
          <Menu.Item onSelect={() => formRef.current?.requestSubmit()} className={`${item} mt-1 text-destructive-fg`}>
            <LogOut className="size-5" strokeWidth={1.75} aria-hidden />Sign Out
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function WibClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(clock.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden items-center gap-2 text-sm font-medium sm:flex" aria-label="Current time in WIB">
      <Clock className="size-[18px] text-muted" aria-hidden />
      <span className="tabular-nums">{now ?? "--:--"}</span>
      <span className="text-xs text-muted">WIB</span>
    </div>
  );
}

export function AppFrame({ items, name, role, signOut, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const path = usePathname();
  // pending is only valid until the path changes (derived, no effect needed).
  const [pick, setPick] = useState<{ href: string; from: string } | null>(null);
  const pending = pick && pick.from === path ? pick.href : null;
  const onPick = (href: string) => { if (!isActive(items, href, path)) setPick({ href, from: path }); };
  const current = pending ? items.find((i) => i.href === pending)! : [...items].reverse().find((i) => isActive(items, i.href, path)) ?? items[0];
  const Icon = icons[current.icon as keyof typeof icons];
  const toggle = "grid size-11 shrink-0 place-items-center rounded-lg text-navy hover:bg-navy/[0.06]";

  return (
    <div className="flex min-h-dvh bg-surface">
      {pending && (
        <div className="fixed inset-x-0 top-0 z-[90] h-0.5 overflow-hidden bg-gold/20" role="progressbar" aria-label="Loading page">
          <div className="h-full w-1/3 animate-[sg-bar_1s_ease-in-out_infinite] bg-gold" />
        </div>
      )}
      <motion.aside animate={{ width: collapsed ? 84 : 288 }} initial={false} transition={{ duration: reduce ? 0 : 0.18 }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden bg-navy md:flex">
        <Brand collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto px-4 pt-2"><Links items={items} collapsed={collapsed} pending={pending} onPick={onPick} /></div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-2 border-b border-border bg-surface px-3 shadow-[0_1px_2px_rgb(16_24_40/0.03)] sm:gap-3 sm:px-5">
          <button onClick={() => setCollapsed(!collapsed)} className={`${toggle} hidden md:grid`} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <PanelLeft className="size-[22px]" strokeWidth={1.75} />
          </button>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className={`${toggle} md:hidden`} aria-label="Open navigation"><MenuIcon /></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-navy/40 data-[state=open]:animate-[sg-fade_150ms_ease-out]" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-navy shadow-xl outline-none data-[state=open]:animate-[sg-drawer_180ms_ease-out]">
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Description className="sr-only">Pages available to your role</Dialog.Description>
                <div className="flex items-center justify-between pr-2"><Brand />
                  <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-lg text-white hover:bg-white/10" aria-label="Close navigation"><X /></Dialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pt-2"><Links items={items} collapsed={false} onNavigate={() => setOpen(false)} pending={pending} onPick={onPick} /></div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <span className="hidden size-12 shrink-0 place-items-center rounded-lg bg-canvas text-gold sm:grid" aria-hidden><Icon className="size-6" strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold leading-tight sm:text-xl">{current.label}</p>
            <p className="hidden truncate text-sm text-muted sm:block">{current.subtitle}</p>
          </div>
          <WibClock />
          <UserMenu name={name} role={role} signOut={signOut} />
        </header>
        <main aria-busy={!!pending} className={`min-w-0 flex-1 p-4 transition-opacity duration-150 sm:p-6 ${pending ? "opacity-60" : ""}`}>{children}</main>
      </div>
    </div>
  );
}
