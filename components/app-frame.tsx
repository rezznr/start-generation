"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, ChevronDown, Clock, FileText, LayoutGrid, LogOut, Menu as MenuIcon, PanelLeft, Receipt, Search, Star, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const icons = { layout: LayoutGrid, star: Star, receipt: Receipt, file: FileText, wallet: Wallet, calendar: Calendar, search: Search };
type Item = { href: string; label: string; icon: string; subtitle: string };
type Props = { items: Item[]; name: string; role: string; signOut: () => Promise<void>; children: ReactNode };

const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });

function Links({ items, collapsed, onNavigate }: { items: Item[]; collapsed: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="space-y-2">
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon as keyof typeof icons];
        // The first item is the role home, so it only matches exactly.
        const active = href === items[0].href ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} onClick={onNavigate} title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={`flex h-12 items-center gap-3.5 rounded-lg px-4 font-medium transition-colors duration-150 ${active ? "bg-navy text-gold-soft" : "text-navy hover:bg-navy/[0.06]"} ${collapsed ? "justify-center px-0" : ""}`}>
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
      <Image src="/tab-icon.webp" alt="" width={40} height={40} className="size-10 shrink-0" />
      {!collapsed && <span className="text-lg font-bold tracking-tight text-navy">STAR GENERATION</span>}
    </div>
  );
}

const initials = (n: string) => n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function UserMenu({ name, role, signOut }: { name: string; role: string; signOut: () => Promise<void> }) {
  const item = "flex h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-[15px] outline-none data-[highlighted]:bg-navy/[0.06]";
  return (
    <Menu.Root>
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
          <form action={signOut} className="mt-1">
            <Menu.Item asChild>
              <button className={`${item} text-destructive-fg`}><LogOut className="size-5" strokeWidth={1.75} aria-hidden />Sign Out</button>
            </Menu.Item>
          </form>
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
  const current = [...items].reverse().find((i) => (i.href === items[0].href ? path === i.href : path.startsWith(i.href))) ?? items[0];
  const Icon = icons[current.icon as keyof typeof icons];
  const toggle = "grid size-11 shrink-0 place-items-center rounded-lg text-navy hover:bg-navy/[0.06]";

  return (
    <div className="flex min-h-dvh bg-canvas">
      <motion.aside animate={{ width: collapsed ? 84 : 288 }} initial={false} transition={{ duration: reduce ? 0 : 0.18 }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-border bg-surface md:flex">
        <Brand collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto px-4 pt-2"><Links items={items} collapsed={collapsed} /></div>
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
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-surface shadow-xl outline-none data-[state=open]:animate-[sg-drawer_180ms_ease-out]">
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Description className="sr-only">Pages available to your role</Dialog.Description>
                <div className="flex items-center justify-between pr-2"><Brand />
                  <Dialog.Close className={toggle} aria-label="Close navigation"><X /></Dialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pt-2"><Links items={items} collapsed={false} onNavigate={() => setOpen(false)} /></div>
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
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
