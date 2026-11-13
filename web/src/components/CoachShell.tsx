import { Ear, LayoutGrid, ListChecks, MoreHorizontal, TerminalSquare } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useCoachTheme } from "@/store/theme-store";

interface NavItem {
  to: string;
  label: "Modes" | "Coach" | "Jobs" | "Terminal" | "More";
  icon: typeof LayoutGrid;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Modes",
    icon: LayoutGrid,
    match: (p) => p === "/",
  },
  {
    to: "/coach",
    label: "Coach",
    icon: Ear,
    match: (p) => p.startsWith("/coach"),
  },
  {
    to: "/jobs",
    label: "Jobs",
    icon: ListChecks,
    match: (p) => p.startsWith("/jobs"),
  },
  {
    to: "/terminal",
    label: "Terminal",
    icon: TerminalSquare,
    match: (p) => p.startsWith("/terminal"),
  },
  {
    to: "/settings",
    label: "More",
    icon: MoreHorizontal,
    match: (p) => p.startsWith("/settings") || p.startsWith("/more"),
  },
];

export function CoachShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { settings } = useCoachTheme();

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-3 pb-24 pt-2.5 sm:px-5 sm:pt-4">
        {children}
      </main>

      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/85 bg-card/95 backdrop-blur-md"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-5 px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.match(location.pathname);
            return (
              <NavLink
                key={item.label}
                to={item.to}
                aria-current={active ? "page" : undefined}
                style={active ? { color: settings.accentColor } : undefined}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg py-1 font-mono text-[10px] font-medium transition-colors sm:text-xs",
                  active ? "font-semibold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
