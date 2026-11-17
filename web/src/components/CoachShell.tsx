import { Ear, LayoutGrid, ListChecks, MoreHorizontal, TerminalSquare } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useCardAudio } from "@/hooks/useCardAudio";
import { stopCoachEchoIntro, wasIntroJustStarted } from "@/lib/intro-audio";
import { cn } from "@/lib/utils";
import { useCoachTheme } from "@/store/theme-store";
import { TourProvider, useGuidedTour } from "@/store/tour-store";

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

function CoachShellInner({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { settings } = useCoachTheme();
  const { stop } = useCardAudio();
  const tour = useGuidedTour();
  const prevPathnameRef = useRef<string>(location.pathname);

  useLayoutEffect(() => {
    const prev = prevPathnameRef.current;
    const next = location.pathname;
    if (prev === next) return;
    prevPathnameRef.current = next;

    const isTourTransition =
      Boolean(tour?.tourActive) ||
      location.search.includes("whoswho=1") ||
      location.search.includes("tourclose=1");

    if (!isTourTransition) {
      stop();
    }
    const isModesFirstTapDrilldown =
      prev === "/" && (next === "/jobs" || next === "/coach") && wasIntroJustStarted(150);
    if (!isModesFirstTapDrilldown) {
      stopCoachEchoIntro();
    }
  }, [location.pathname, location.search, stop, tour?.tourActive]);

  const isCoachScreen = location.pathname.startsWith("/coach");

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <main
        className={cn(
          "mx-auto w-full max-w-2xl px-3 sm:px-5",
          isCoachScreen
            ? "pb-[calc(4rem+env(safe-area-inset-bottom))] pt-2 sm:pb-24 sm:pt-4"
            : "pb-24 pt-2.5 sm:pt-4",
        )}
      >
        {children}
      </main>

      {tour?.tourActive ? (
        <div
          data-testid="guided-tour-banner"
          data-tour-step={tour.currentStep?.id ?? "done"}
          role="region"
          aria-label="Guided tour"
          className="fixed inset-x-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom))] z-40 px-2.5 pb-1.5"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-2.5 rounded-xl border border-sky-400/70 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <span className="mr-2 inline-block rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300">
                Tour {tour.stepIndex + 1}/5
              </span>
              <span
                data-testid="guided-tour-text"
                className="font-mono text-xs font-medium text-foreground"
              >
                {tour.bannerText}
              </span>
            </div>
            <button
              type="button"
              data-testid="guided-tour-skip"
              onClick={tour.skipTour}
              className="shrink-0 rounded-lg border border-border bg-background/80 px-2.5 py-1 font-mono text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400 hover:text-sky-200"
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/85 bg-card/95 backdrop-blur-md"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-5 px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.match(location.pathname);
            const isTourTarget = Boolean(
              tour?.tourActive && tour.currentStep?.navLabel === item.label,
            );
            return (
              <NavLink
                key={item.label}
                to={item.to}
                data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                data-tour-highlighted={isTourTarget ? "true" : "false"}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (tour?.tourActive) {
                    const allowed = tour.handleTourNavClick(item.label);
                    if (!allowed) {
                      e.preventDefault();
                    }
                    return;
                  }
                  if (active) return;
                  stop();
                  const isModesFirstTapToCoach =
                    location.pathname === "/" && item.to === "/coach" && wasIntroJustStarted(150);
                  if (!isModesFirstTapToCoach) {
                    stopCoachEchoIntro();
                  }
                }}
                style={active && !isTourTarget ? { color: settings.accentColor } : undefined}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg py-1 font-mono text-[10px] font-medium transition-all sm:text-xs",
                  isTourTarget
                    ? "animate-pulse bg-sky-500/20 font-bold text-sky-200 ring-2 ring-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.55)]"
                    : active
                      ? "font-semibold"
                      : "text-muted-foreground hover:text-foreground",
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

export function CoachShell({ children }: { children: ReactNode }) {
  return (
    <TourProvider>
      <CoachShellInner>{children}</CoachShellInner>
    </TourProvider>
  );
}
