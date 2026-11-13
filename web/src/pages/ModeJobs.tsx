import { ArrowLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { loadCoachMode, saveCoachMode, type ActiveCoachMode } from "@/lib/coach";
import {
  buildModeSummaries,
  loadActiveJobId,
  loadAllProgressSnapshot,
  resolveJobRowForMode,
  saveActiveJobId,
  statusDotTailwind,
} from "@/lib/mode-metrics";
import { cn } from "@/lib/utils";
import { hexToRgba, useCoachTheme } from "@/store/theme-store";
import { COACH_JOBS } from "@/data/coach-jobs";

const VALID_MODES: ActiveCoachMode[] = ["easy", "medium", "hard", "extreme"];

function parseModeParam(raw: string | null): ActiveCoachMode {
  if (raw && (VALID_MODES as string[]).includes(raw)) {
    return raw as ActiveCoachMode;
  }
  return loadCoachMode();
}

export default function ModeJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useCoachTheme();

  const selectedMode = parseModeParam(searchParams.get("mode"));
  const modeColor = settings.modeColors[selectedMode];
  const activeJobId = useMemo(() => loadActiveJobId(), []);
  const snapshot = useMemo(() => loadAllProgressSnapshot(), []);
  const summaries = useMemo(() => buildModeSummaries(snapshot, selectedMode), [selectedMode, snapshot]);
  const currentSummary = summaries.find((s) => s.mode === selectedMode) ?? summaries[0];

  const rows = useMemo(
    () => COACH_JOBS.map((j, idx) => resolveJobRowForMode(j, idx, selectedMode, snapshot, activeJobId)),
    [activeJobId, selectedMode, snapshot],
  );

  const handlePickMode = (nextMode: ActiveCoachMode): void => {
    saveCoachMode(nextMode);
    setSearchParams({ mode: nextMode });
  };

  const handleOpenJob = (jobId: string): void => {
    saveCoachMode(selectedMode);
    saveActiveJobId(jobId);
    navigate(`/coach?mode=${selectedMode}&job=${encodeURIComponent(jobId)}`);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-3.5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            aria-label="Back to Modes"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">
                {currentSummary.name} Jobs
              </h1>
              {currentSummary.badge ? (
                <span
                  style={{
                    borderColor: hexToRgba(modeColor, 0.8),
                    backgroundColor: hexToRgba(modeColor, 0.2),
                    color: modeColor,
                  }}
                  className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                >
                  {currentSummary.badge}
                </span>
              ) : null}
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground">{currentSummary.statusLine}</p>
          </div>
        </div>
      </header>

      {/* Mode Switcher Pills */}
      <nav aria-label="Switch mode job list" className="grid grid-cols-4 gap-1.5">
        {summaries.map((s) => {
          const c = settings.modeColors[s.mode];
          const active = s.mode === selectedMode;
          return (
            <button
              key={s.mode}
              type="button"
              aria-pressed={active}
              onClick={() => handlePickMode(s.mode)}
              style={{
                borderColor: active ? c : hexToRgba(c, 0.35),
                backgroundColor: active ? hexToRgba(c, 0.16) : undefined,
                color: active ? c : undefined,
              }}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-center font-mono text-xs font-medium transition-colors",
                !active && "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          );
        })}
      </nav>

      {/* Status Dot Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card/70 px-3 py-2 font-mono text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-zinc-500" /> not done
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-400" /> working
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> passed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-400" /> hint used
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> failed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> locked (3d)
        </span>
      </div>

      {/* 19 Jobs List */}
      <section aria-label={`${currentSummary.name} job list`} className="space-y-2">
        {rows.map((row) => (
          <button
            key={row.job.id}
            type="button"
            data-testid={`job-row-${row.job.id}`}
            data-job-dot={row.dot}
            onClick={() => handleOpenJob(row.job.id)}
            style={{
              borderColor: row.passed ? hexToRgba(modeColor, 0.55) : undefined,
            }}
            className="group flex w-full min-w-0 max-w-full items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-foreground/30 active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="tnum shrink-0 font-mono text-xs text-muted-foreground">
                  #{String(row.index + 1).padStart(2, "0")}
                </span>
                <span className="truncate font-mono text-xs font-semibold text-foreground sm:text-sm">
                  {row.job.title}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{row.job.job}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-2 py-0.5">
                <span
                  aria-hidden="true"
                  className={cn("h-2 w-2 shrink-0 rounded-full", statusDotTailwind(row.dot))}
                />
                <span className="font-mono text-[10px] text-foreground/85">{row.statusLabel}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
