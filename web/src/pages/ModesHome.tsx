import { Blocks, BookOpen, ChevronRight, Cpu, Flame } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { loadCoachMode, saveCoachMode, type ActiveCoachMode } from "@/lib/coach";
import {
  buildModeSummaries,
  loadAllProgressSnapshot,
  statusDotTailwind,
  type ModeCardSummary,
  type ProgressRingStat,
  type SparklineTileStat,
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
      className="col-span-2 flex flex-col items-center justify-center rounded-lg border border-border/70 bg-background/55 px-1.5 py-2 sm:col-span-1"
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

function MiniSparklineTile({ tile, color }: { tile: SparklineTileStat; color: string }) {
  const width = 96;
  const height = 24;
  const pad = 2;
  const pts = tile.points.length > 0 ? tile.points : [0];
  const maxVal = Math.max(1, ...pts);
  const stepX = pts.length > 1 ? (width - pad * 2) / (pts.length - 1) : 0;

  const coords = pts.map((val, idx) => {
    const x = pad + idx * stepX;
    const y = height - pad - (val / maxVal) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePoints = coords.join(" ");
  const areaPoints = `${pad},${height - pad} ${linePoints} ${width - pad},${height - pad}`;

  return (
    <div
      data-testid={`sparkline-${tile.id}`}
      className="col-span-3 flex flex-col justify-between rounded-lg border border-border/70 bg-background/55 px-2.5 py-2 sm:col-span-1"
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {tile.label}
        </span>
        <span className="tnum shrink-0 font-mono text-xs font-semibold text-foreground">{tile.valueText}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-1.5 h-6 w-full overflow-visible"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon points={areaPoints} fill={hexToRgba(color, 0.16)} />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />
      </svg>
      <span className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{tile.subText}</span>
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

      {/* Bottom Mini Stat Tiles Row: 3 Progress Rings + 2 Sparkline Tiles */}
      <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-5 sm:gap-2">
        {summary.rings.map((ring) => (
          <MiniProgressRing key={ring.id} ring={ring} color={color} />
        ))}
        {summary.sparklines.map((spark) => (
          <MiniSparklineTile key={spark.id} tile={spark} color={color} />
        ))}
      </div>
    </button>
  );
}

export default function ModesHome() {
  const navigate = useNavigate();
  const { settings } = useCoachTheme();
  const activeMode = useMemo(() => loadCoachMode(), []);
  const snapshot = useMemo(() => loadAllProgressSnapshot(), []);
  const summaries = useMemo(() => buildModeSummaries(snapshot, activeMode), [activeMode, snapshot]);

  const handleSelectModeCard = (mode: ActiveCoachMode): void => {
    saveCoachMode(mode);
    navigate(`/jobs?mode=${mode}`);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-3.5">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-2 px-0.5 pt-1">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Coach</h1>
          <p className="font-mono text-xs text-muted-foreground">
            16 real sysadmin jobs · truthful shell · zero points
          </p>
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
