import { COACH_JOBS, type CoachJob } from "@/data/coach-jobs";
import {
  extremeJobStatus,
  loadCoachProgress,
  loadEasyProgress,
  loadExtremeProgress,
  loadMediumProgress,
  lockRemainingWords,
  type ActiveCoachMode,
  type CoachProgress,
  type EasyProgress,
  type ExtremeProgress,
  type MediumProgress,
} from "@/lib/coach";
import { loadState, saveState } from "@/lib/storage";

export const ACTIVE_JOB_STORAGE_KEY = "coachActiveJobId";

export function loadActiveJobId(): string | null {
  return loadState<string | null>(ACTIVE_JOB_STORAGE_KEY, null);
}

export function saveActiveJobId(jobId: string | null): void {
  saveState(ACTIVE_JOB_STORAGE_KEY, jobId);
}

/**
 * Exact status dot colors required by spec:
 * grey = not done, purple = working, green = passed,
 * yellow = hint used, red = failed, amber = locked (3-day Extreme retest).
 */
export type StatusDotColor = "grey" | "purple" | "green" | "yellow" | "red" | "amber";

export interface JobModeRow {
  job: CoachJob;
  index: number;
  dot: StatusDotColor;
  statusLabel: string;
  passed: boolean;
  attempts: number;
}

export interface ProgressRingStat {
  id: string;
  label: string;
  value: number;
  total: number;
  percent: number;
}

export interface SparklineTileStat {
  id: string;
  label: string;
  valueText: string;
  subText: string;
  /** Real 16-point series across COACH_JOBS (no fake or random numbers). */
  points: number[];
}

export interface ModeCardSummary {
  mode: ActiveCoachMode;
  name: string;
  subtitle: string;
  badge?: string;
  dot: StatusDotColor;
  statusLine: string;
  passedCount: number;
  totalCount: number;
  rings: [ProgressRingStat, ProgressRingStat, ProgressRingStat];
  sparklines: [SparklineTileStat, SparklineTileStat];
  jobs: JobModeRow[];
}

export interface AllProgressSnapshot {
  easy: EasyProgress;
  medium: MediumProgress;
  hard: CoachProgress;
  extreme: ExtremeProgress;
}

export function loadAllProgressSnapshot(): AllProgressSnapshot {
  return {
    easy: loadEasyProgress(),
    medium: loadMediumProgress(),
    hard: loadCoachProgress(),
    extreme: loadExtremeProgress(),
  };
}

function makeRing(id: string, label: string, value: number, total: number): ProgressRingStat {
  const safeTotal = Math.max(1, total);
  const clamped = Math.max(0, Math.min(total, value));
  return {
    id,
    label,
    value: clamped,
    total,
    percent: Math.round((clamped / safeTotal) * 100),
  };
}

export function resolveJobRowForMode(
  job: CoachJob,
  index: number,
  mode: ActiveCoachMode,
  snapshot: AllProgressSnapshot,
  activeWorkingJobId?: string | null,
  now: number = Date.now(),
): JobModeRow {
  if (mode === "easy") {
    const rec = snapshot.easy[job.id];
    const attempts = rec?.attempts ?? 0;
    const passed = Boolean(rec?.passed);
    let dot: StatusDotColor = "grey";
    let statusLabel = "not done";
    if (rec?.hintUsed && passed) {
      dot = "yellow";
      statusLabel = "passed · hint used";
    } else if (passed) {
      dot = "green";
      statusLabel = "passed";
    } else if (rec?.hintUsed) {
      dot = "yellow";
      statusLabel = "hint used";
    } else if (rec?.lastFailed) {
      dot = "red";
      statusLabel = "failed";
    } else if (activeWorkingJobId === job.id) {
      dot = "purple";
      statusLabel = "working";
    }
    return { job, index, dot, statusLabel, passed, attempts };
  }

  if (mode === "medium") {
    const rec = snapshot.medium[job.id];
    const attempts = rec?.attempts ?? 0;
    const passed = rec?.status === "passed";
    let dot: StatusDotColor = "grey";
    let statusLabel = "not done";
    if (passed) {
      dot = "green";
      statusLabel = "passed";
    } else if (rec?.status === "hint-used") {
      dot = "yellow";
      statusLabel = "hint used";
    } else if (rec?.status === "failed") {
      dot = "red";
      statusLabel = "failed";
    } else if (activeWorkingJobId === job.id) {
      dot = "purple";
      statusLabel = "working";
    }
    return { job, index, dot, statusLabel, passed, attempts };
  }

  if (mode === "hard") {
    const rec = snapshot.hard[job.id];
    const attempts = rec?.attempts ?? 0;
    const passed = (rec?.coldPasses ?? 0) > 0;
    let dot: StatusDotColor = "grey";
    let statusLabel = "not done";
    if (passed && rec?.nextRetestAt !== null && rec?.nextRetestAt !== undefined && now >= rec.nextRetestAt) {
      dot = "amber";
      statusLabel = "retest due";
    } else if (passed) {
      dot = "green";
      statusLabel = "passed cold";
    } else if (rec?.solvedWithHelp) {
      dot = "yellow";
      statusLabel = "hint used";
    } else if (attempts > 0) {
      dot = activeWorkingJobId === job.id ? "purple" : "red";
      statusLabel = activeWorkingJobId === job.id ? "working" : "failed";
    } else if (activeWorkingJobId === job.id) {
      dot = "purple";
      statusLabel = "working";
    }
    return { job, index, dot, statusLabel, passed, attempts };
  }

  // extreme
  const rec = snapshot.extreme[job.id];
  const attempts = rec?.attempts ?? 0;
  const exStatus = extremeJobStatus(rec, now);
  const passed = exStatus === "complete";
  let dot: StatusDotColor = "grey";
  let statusLabel = "not done";
  if (exStatus === "complete") {
    dot = "green";
    statusLabel = "proved cold 2x";
  } else if (exStatus === "locked") {
    dot = "amber";
    statusLabel = `locked (${lockRemainingWords(rec?.nextRetestAt ?? null, now)})`;
  } else if (exStatus === "retest-due") {
    dot = "purple";
    statusLabel = "cold retest open";
  } else if (attempts > 0) {
    dot = "red";
    statusLabel = "failed";
  } else if (activeWorkingJobId === job.id) {
    dot = "purple";
    statusLabel = "working";
  }
  return { job, index, dot, statusLabel, passed, attempts };
}

function summarizeModeDot(rows: JobModeRow[], mode: ActiveCoachMode, activeMode: ActiveCoachMode): StatusDotColor {
  if (rows.length > 0 && rows.every((r) => r.passed)) return "green";
  if (rows.some((r) => r.dot === "amber")) return "amber";
  if (rows.some((r) => r.dot === "red")) return "red";
  if (rows.some((r) => r.dot === "purple")) return "purple";
  if (rows.some((r) => r.dot === "green")) return "green";
  if (rows.some((r) => r.dot === "yellow")) return "yellow";
  if (mode === activeMode && rows.some((r) => r.attempts > 0)) return "purple";
  return "grey";
}

export function buildModeSummaries(
  snapshot: AllProgressSnapshot,
  activeMode: ActiveCoachMode,
  now: number = Date.now(),
): ModeCardSummary[] {
  const total = COACH_JOBS.length;
  const rebootTotal = COACH_JOBS.filter((j) => Boolean(j.rebootCheck)).length;

  // 1. Easy
  const easyRows = COACH_JOBS.map((j, i) => resolveJobRowForMode(j, i, "easy", snapshot, null, now));
  const easyPassed = easyRows.filter((r) => r.passed).length;
  const easyNoHintPassed = COACH_JOBS.filter((j) => {
    const rec = snapshot.easy[j.id];
    return Boolean(rec?.passed && !rec?.hintUsed);
  }).length;
  const easyTried = easyRows.filter((r) => r.attempts > 0).length;
  const easyTotalAttempts = easyRows.reduce((sum, r) => sum + r.attempts, 0);

  // 2. Medium
  const mediumRows = COACH_JOBS.map((j, i) => resolveJobRowForMode(j, i, "medium", snapshot, null, now));
  const mediumPassed = mediumRows.filter((r) => r.passed).length;
  const mediumTried = mediumRows.filter((r) => r.attempts > 0).length;
  const mediumHinted = mediumRows.filter((r) => r.dot === "yellow").length;
  const mediumTotalAttempts = mediumRows.reduce((sum, r) => sum + r.attempts, 0);

  // 3. Hard
  const hardRows = COACH_JOBS.map((j, i) => resolveJobRowForMode(j, i, "hard", snapshot, null, now));
  const hardPassed = hardRows.filter((r) => r.passed).length;
  const hardTried = hardRows.filter((r) => r.attempts > 0).length;
  const hardRebootPassed = COACH_JOBS.filter((j) => Boolean(j.rebootCheck && snapshot.hard[j.id]?.rebootPassed)).length;
  const hardTotalAttempts = hardRows.reduce((sum, r) => sum + r.attempts, 0);

  // 4. Extreme
  const extremeRows = COACH_JOBS.map((j, i) => resolveJobRowForMode(j, i, "extreme", snapshot, null, now));
  const extremeComplete = extremeRows.filter((r) => r.passed).length;
  const extremeLocked = extremeRows.filter((r) => r.dot === "amber").length;
  const extremeFirstCold = COACH_JOBS.filter((j) => {
    const st = snapshot.extreme[j.id]?.stage;
    return st === "awaiting-retest" || st === "complete";
  }).length;
  const extremeTotalAttempts = extremeRows.reduce((sum, r) => sum + r.attempts, 0);

  return [
    {
      mode: "easy",
      name: "Easy",
      subtitle: "Word blocks — learn each word with zero typing",
      dot: summarizeModeDot(easyRows, "easy", activeMode),
      statusLine: `${easyPassed} / ${total} passed`,
      passedCount: easyPassed,
      totalCount: total,
      rings: [
        makeRing("easy-passed", "Passed", easyPassed, total),
        makeRing("easy-clean", "No Hint", easyNoHintPassed, total),
        makeRing("easy-tried", "Tried", easyTried, total),
      ],
      sparklines: [
        {
          id: "easy-pass-map",
          label: "Jobs Passed",
          valueText: `${easyPassed}/${total}`,
          subText: "16-job pass profile",
          points: easyRows.map((r) => (r.passed ? 1 : 0)),
        },
        {
          id: "easy-attempts",
          label: "Runs",
          valueText: `${easyTotalAttempts}`,
          subText: `${easyTried} jobs touched`,
          points: easyRows.map((r) => r.attempts),
        },
      ],
      jobs: easyRows,
    },
    {
      mode: "medium",
      name: "Medium",
      subtitle: "Shadow typing + plain-words step walkthrough",
      dot: summarizeModeDot(mediumRows, "medium", activeMode),
      statusLine:
        mediumHinted > 0
          ? `${mediumPassed} / ${total} passed · ${mediumHinted} hint`
          : `${mediumPassed} / ${total} passed`,
      passedCount: mediumPassed,
      totalCount: total,
      rings: [
        makeRing("medium-passed", "Passed", mediumPassed, total),
        makeRing("medium-tried", "Tried", mediumTried, total),
        makeRing("medium-clean", "Clean", Math.max(0, mediumTried - mediumHinted), total),
      ],
      sparklines: [
        {
          id: "medium-pass-map",
          label: "Shadow Cold",
          valueText: `${mediumPassed}/${total}`,
          subText: "16-job pass profile",
          points: mediumRows.map((r) => (r.passed ? 1 : 0)),
        },
        {
          id: "medium-attempts",
          label: "Rounds",
          valueText: `${mediumTotalAttempts}`,
          subText: `${mediumTried} jobs touched`,
          points: mediumRows.map((r) => r.attempts),
        },
      ],
      jobs: mediumRows,
    },
    {
      mode: "hard",
      name: "Hard",
      subtitle: "Cold shell — coach points, never gives the command",
      dot: summarizeModeDot(hardRows, "hard", activeMode),
      statusLine: `${hardPassed} / ${total} cold`,
      passedCount: hardPassed,
      totalCount: total,
      rings: [
        makeRing("hard-passed", "Cold Pass", hardPassed, total),
        makeRing("hard-reboot", "Reboot", hardRebootPassed, rebootTotal),
        makeRing("hard-tried", "Tried", hardTried, total),
      ],
      sparklines: [
        {
          id: "hard-pass-map",
          label: "Cold Jobs",
          valueText: `${hardPassed}/${total}`,
          subText: "16-job cold profile",
          points: hardRows.map((r) => (r.passed ? 1 : 0)),
        },
        {
          id: "hard-attempts",
          label: "Rounds",
          valueText: `${hardTotalAttempts}`,
          subText: `${hardTried} jobs touched`,
          points: hardRows.map((r) => r.attempts),
        },
      ],
      jobs: hardRows,
    },
    {
      mode: "extreme",
      name: "Extreme",
      subtitle: "Zero hints · first-try cold + 3-day retest lock",
      badge: "OVERLOAD",
      dot: summarizeModeDot(extremeRows, "extreme", activeMode),
      statusLine:
        extremeLocked > 0
          ? `${extremeComplete} / ${total} proved · ${extremeLocked} locked`
          : `${extremeComplete} / ${total} proved 2x`,
      passedCount: extremeComplete,
      totalCount: total,
      rings: [
        makeRing("extreme-complete", "Proved 2x", extremeComplete, total),
        makeRing("extreme-cold1", "Cold 1x", extremeFirstCold, total),
        makeRing("extreme-locked", "3d Lock", extremeLocked, total),
      ],
      sparklines: [
        {
          id: "extreme-pass-map",
          label: "Proved Cold",
          valueText: `${extremeComplete}/${total}`,
          subText: `${extremeLocked} in 3d lock`,
          points: extremeRows.map((r) => (r.passed ? 2 : r.dot === "amber" ? 1 : 0)),
        },
        {
          id: "extreme-attempts",
          label: "Tries",
          valueText: `${extremeTotalAttempts}`,
          subText: "zero-hint rounds",
          points: extremeRows.map((r) => r.attempts),
        },
      ],
      jobs: extremeRows,
    },
  ];
}

export function statusDotTailwind(dot: StatusDotColor): string {
  switch (dot) {
    case "green":
      return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]";
    case "purple":
      return "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.65)]";
    case "yellow":
      return "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]";
    case "red":
      return "animate-pulse bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.75)]";
    case "amber":
      return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]";
    case "grey":
    default:
      return "bg-zinc-500";
  }
}
