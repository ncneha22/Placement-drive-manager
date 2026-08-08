import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  CalendarRange,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Master Companies", icon: Building2 },
  { to: "/drives", label: "Placement Drives", icon: CalendarRange },
  { to: "/reports", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <aside className="fixed left-0 top-0 z-20 hidden h-full w-64 flex-col bg-sidebar p-6 text-sidebar-foreground lg:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            P
          </div>
          <span className="text-xl font-bold uppercase tracking-tight">
            Placematrix
          </span>
        </div>

        <nav className="space-y-1">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto text-[10px] leading-relaxed text-sidebar-foreground/40">
          V05 — Employer &amp; Placement Drive Records. Companies stored once,
          referenced by every drive.
        </p>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 px-8 backdrop-blur-md">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-4">{actions}</div>
        </header>
        <div className="mx-auto max-w-7xl space-y-8 p-8">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  footnote,
  tone = "muted",
}: {
  label: string;
  value: string | number;
  footnote: string;
  tone?: "muted" | "success" | "primary" | "mono";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-bold">{value}</p>
      <div
        className={cn(
          "mt-2 text-[10px]",
          tone === "success" && "font-bold text-success",
          tone === "primary" && "font-bold italic tracking-tight text-primary",
          tone === "mono" && "font-mono text-muted-foreground",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {footnote}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Completed"
      ? "bg-success/10 text-success"
      : status === "Scheduled"
        ? "bg-primary/10 text-primary"
        : status === "Cancelled"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tone,
      )}
    >
      {status}
    </span>
  );
}
