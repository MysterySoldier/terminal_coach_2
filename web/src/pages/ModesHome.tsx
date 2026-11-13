import { Blocks, BookOpen, ChevronRight, Cpu, Flame, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { loadCoachMode, saveCoachMode, type ActiveCoachMode } from "@/lib/coach";
import {
  ensureCoachEchoIntroAudio,
  hasPlayedIntroThisSession,
  markIntroPlayedThisSession,
  playCoachEchoIntro,
  tryPlayCoachEchoIntro,
} from "@/lib/intro-audio";
import {
  buildModeSummaries,
  loadAllProgressSnapshot,
  statusDotTailwind,
  type ModeCardSummary,
  type ProgressRingStat,
} from "@/lib/mode-metrics";
import { cn } from "@/lib/utils";
import { hexToRgba, useCoachTheme } from "@/store/theme-store";

function ModeIcon({ mode, color }: { mode: ActiveCoachMode; color: string }) {
  const iconProps = { className: "h-5 w-5", style: { color }, "aria-hidden": true as const };
  switch (mode) {
    case "easy":
      return <Blocks {...iconProps} />;
    case "medium":
      return <BookOpen {...iconProps} />;
    case "hard":
      return <Cpu {...iconProps} />;
    case "extreme":
      return <Flame {...iconProps} />;
  }
}

function MiniProgressRing({ ring, color }: { ring: ProgressRingStat; color: string }) {
  const size = 42;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (ring.percent / 100) * circumference;

  return (
    <div
      data-testid={`ring-${ring.id}`}
      className="flex flex-col items-center justify-center rounded-lg border border-border/70 bg-background/55 px-1.5 py-2"
    >
      <div className="relative flex h-[42px] w-[42px] items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted-foreground/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="tnum absolute font-mono text-[10px] font-semibold text-foreground">
          {ring.value}/{ring.total}
        </span>
      </div>
      <span className="mt-1 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {ring.label}
      </span>
    </div>
  );
}

function ModeDashboardCard({
  summary,
  color,
  onSelect,
}: {
  summary: ModeCardSummary;
  color: string;
  onSelect: (mode: ActiveCoachMode) => void;
}) {
  const isHard = summary.mode === "hard";
  const isExtreme = summary.mode === "extreme";

  return (
    <button
      type="button"
      data-testid={`mode-card-${summary.mode}`}
      data-mode-dot={summary.dot}
      onClick={() => onSelect(summary.mode)}
      style={{
        borderColor: isExtreme ? hexToRgba(color, 0.85) : hexToRgba(color, 0.45),
        boxShadow: isExtreme
          ? `0 0 0 1px ${hexToRgba(color, 0.55)}, 0 0 22px ${hexToRgba(color, 0.32)}, inset 0 0 18px ${hexToRgba(color, 0.08)}`
          : undefined,
      }}
      className={cn(
        "group w-full min-w-0 max-w-full rounded-2xl border bg-card p-3.5 text-left transition-all active:scale-[0.99] sm:p-4",
        isHard && "animate-hard-pulse",
      )}
    >
      {/* Top NeoServer Card Header: Round icon + Name & Subtitle + Top-Right Status Line */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
            style={{
              backgroundColor: hexToRgba(color, 0.14),
              borderColor: hexToRgba(color, 0.45),
            }}
          >
            <ModeIcon mode={summary.mode} color={color} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-base font-bold tracking-tight text-foreground">{summary.name}</span>
              {summary.badge ? (
                <span
                  data-testid="overload-badge"
                  style={{
                    borderColor: hexToRgba(color, 0.8),
                    backgroundColor: hexToRgba(color, 0.2),
                    color,
                  }}
                  className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
                >
                  {summary.badge}
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">{summary.subtitle}</p>
          </div>
        </div>

        {/* Status line top-right */}
        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <span
            aria-hidden="true"
            data-status-dot={summary.dot}
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full", statusDotTailwind(summary.dot))}
          />
          <span className="tnum font-mono text-xs text-foreground/90">{summary.statusLine}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
        </div>
      </div>

      {/* 3 Progress Rings */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
        {summary.rings.map((ring) => (
          <MiniProgressRing key={ring.id} ring={ring} color={color} />
        ))}
      </div>
    </button>
  );
}

const INTRO_AUTOPLAY_DELAY_MS = 3000;

export default function ModesHome() {
  const navigate = useNavigate();
  const { settings } = useCoachTheme();
  const activeMode = useMemo(() => loadCoachMode(), []);
  const snapshot = useMemo(() => loadAllProgressSnapshot(), []);
  const summaries = useMemo(() => buildModeSummaries(snapshot, activeMode), [activeMode, snapshot]);

  useEffect(() => {
    if (hasPlayedIntroThisSession()) return;

    ensureCoachEchoIntroAudio();

    let disposed = false;
    let autoplayTimer: number | undefined;

    const clearAutoplayTimer = (): void => {
      if (autoplayTimer !== undefined) {
        window.clearTimeout(autoplayTimer);
        autoplayTimer = undefined;
      }
    };

    const cleanupFirstTap = (): void => {
      document.removeEventListener("click", handleFirstTap, true);
    };

    const handleFirstTap = (event: MouseEvent): void => {
      clearAutoplayTimer();
      cleanupFirstTap();
      if (hasPlayedIntroThisSession()) return;
      markIntroPlayedThisSession();
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[data-testid="coach-echo-intro-replay"]')) {
        return;
      }
      playCoachEchoIntro();
    };

    document.addEventListener("click", handleFirstTap, true);

    autoplayTimer = window.setTimeout(() => {
      autoplayTimer = undefined;
      if (disposed || hasPlayedIntroThisSession()) return;
      void tryPlayCoachEchoIntro().then((played) => {
        if (played) {
          markIntroPlayedThisSession();
          cleanupFirstTap();
        }
      });
    }, INTRO_AUTOPLAY_DELAY_MS);

    return () => {
      disposed = true;
      clearAutoplayTimer();
      cleanupFirstTap();
    };
  }, []);

  const handleReplayIntro = useCallback((): void => {
    markIntroPlayedThisSession();
    playCoachEchoIntro();
  }, []);

  const handleSelectModeCard = (mode: ActiveCoachMode): void => {
    saveCoachMode(mode);
    navigate(`/jobs?mode=${mode}`);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-3.5">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-2 px-0.5 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Coach Echo</h1>
            <button
              type="button"
              data-testid="coach-echo-intro-replay"
              aria-label="Replay Coach Echo intro"
              onClick={handleReplayIntro}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <p className="font-mono text-xs text-muted-foreground">Over Your Shoulder</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden /> pass
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden /> 3d lock
          </span>
        </div>
      </header>

      {/* 4 Stacked NeoServer Mode Cards */}
      <section aria-label="Training modes" className="space-y-3">
        {summaries.map((summary) => (
          <ModeDashboardCard
            key={summary.mode}
            summary={summary}
            color={settings.modeColors[summary.mode]}
            onSelect={handleSelectModeCard}
          />
        ))}
      </section>
    </div>
  );
}
