import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Settings,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { KuberMark } from "./KuberMark";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  children,
  onAdd,
}: {
  children: ReactNode;
  onAdd?: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-white/5 p-6 lg:flex">
        <Link to="/dashboard" className="flex items-center gap-3">
          <KuberMark className="h-9 w-9" />
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight">Kuber Vault</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Your Wealth
            </div>
          </div>
        </Link>

        <nav className="mt-10 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link
                key={to}
                to={to}
                className={
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all " +
                  (active
                    ? "bg-white/[0.06] text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.06)]"
                    : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground")
                }
              >
                <Icon className={"h-4 w-4 " + (active ? "text-primary" : "")} strokeWidth={2} />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_2px_oklch(0.72_0.19_145)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={onAdd}
          className="mt-8 group relative flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.75_0.20_150)] to-[oklch(0.68_0.17_140)] text-sm font-semibold text-[oklch(0.14_0.02_145)] shadow-[0_10px_30px_-8px_oklch(0.72_0.19_145/0.55)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> New Transaction
        </button>

        <div className="mt-auto text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Offline-first · v1.0 · By jmvtech
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <KuberMark className="h-8 w-8" />
          <span className="font-display text-base font-semibold">Kuber Vault</span>
        </Link>
        <button
          onClick={onAdd}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
          aria-label="Add transaction"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </header>

      <main className="relative z-10 lg:pl-64">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 lg:hidden">
        <div className="mx-4 mb-4 glass-strong flex items-center justify-around rounded-full px-2 py-2">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = path === to;
            return (
              <Link
                key={to}
                to={to}
                className={
                  "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition " +
                  (active ? "text-primary" : "text-muted-foreground")
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
