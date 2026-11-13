import type { EasyBlock, EasyJobPlan, EasyStagePlan } from "@/data/easy-coach";
import type { MediumJobPlan, MediumStage, MediumStep } from "@/data/medium-coach";
import type { ParsedCommand, SandboxTask } from "@/data/sandbox";
import type { CommandResult, ShellSession } from "@/lib/terminal-engine";
import { loadState, saveState } from "@/lib/storage";

/**
 * Over Your Shoulder — the coach layer.
 *
 * No XP, no streaks, no leaderboard. The only thing that counts is a cold
 * pass: you solved a real job with zero hints, without being shown the
 * solution, and the machine itself says the job is done. A cold pass earns a
 * retest three days later; if you can do it cold again, the learning stuck.
 *
 * Progress lives in its own localStorage key, separate from study mode, so
 * the coach never touches the frozen study progress.
 */

export const COACH_STORAGE_KEY = "coachProgress";
export const COLD_RETEST_DAYS = 3;

export interface CoachJobRecord {
  /** Rounds started on this job. */
  attempts: number;
  /** Cold passes: solved with zero hints and no solution shown. */
  coldPasses: number;
  /** Solved at least once with help (hints or the solution shown). */
  solvedWithHelp: boolean;
  /** Epoch ms of the last cold pass, or null. */
  lastColdPassAt: number | null;
  /** Epoch ms when the cold retest is due, or null. */
  nextRetestAt: number | null;
  /** Reboot check passed on the last solved round (jobs that need it). */
  rebootPassed: boolean;
}

export type CoachProgress = Record<string, CoachJobRecord>;

export function emptyJobRecord(): CoachJobRecord {
  return { attempts: 0, coldPasses: 0, solvedWithHelp: false, lastColdPassAt: null, nextRetestAt: null, rebootPassed: false };
}

export function loadCoachProgress(): CoachProgress {
  return loadState<CoachProgress>(COACH_STORAGE_KEY, {});
}

export function saveCoachProgress(progress: CoachProgress): void {
  saveState(COACH_STORAGE_KEY, progress);
}

export interface RoundOutcome {
  /** The job is done — the machine says so. */
  solved: boolean;
  /** Solved with zero hints and no solution shown: a cold pass. */
  coldPass: boolean;
}

/**
 * Record one finished round. A round is cold when the learner used no hints
 * and never saw the solution. Cold passes schedule a retest in 3 days.
 */
export function recordRound(
  progress: CoachProgress,
  jobId: string,
  outcome: { solved: boolean; hintsUsed: number; solutionShown: boolean; rebootPassed: boolean },
  now: number = Date.now(),
): CoachProgress {
  const record = progress[jobId] ?? emptyJobRecord();
  const coldPass = outcome.solved && outcome.hintsUsed === 0 && !outcome.solutionShown;
  const next: CoachJobRecord = {
    ...record,
    attempts: record.attempts + 1,
    coldPasses: record.coldPasses + (coldPass ? 1 : 0),
    solvedWithHelp: record.solvedWithHelp || (outcome.solved && !coldPass),
    lastColdPassAt: coldPass ? now : record.lastColdPassAt,
    nextRetestAt: coldPass ? now + COLD_RETEST_DAYS * 24 * 60 * 60 * 1000 : record.nextRetestAt,
    rebootPassed: record.rebootPassed || outcome.rebootPassed,
  };
  return { ...progress, [jobId]: next };
}

/**
 * Mark the reboot check passed on the last recorded round, without counting
 * a second attempt. Used by the website-down job after the learner reboots
 * and the fix is still standing.
 */
export function markRebootPassed(progress: CoachProgress, jobId: string): CoachProgress {
  const record = progress[jobId] ?? emptyJobRecord();
  return { ...progress, [jobId]: { ...record, rebootPassed: true } };
}

/** True when a cold-passed job is due for its 3-day cold retest. */
export function isRetestDue(record: CoachJobRecord | undefined, now: number = Date.now()): boolean {
  if (!record || record.coldPasses === 0 || record.nextRetestAt === null) return false;
  return now >= record.nextRetestAt;
}

// ---------------------------------------------------------------------------
// Grading: state first, command text second.
// ---------------------------------------------------------------------------

export interface AttemptContext {
  parsed: ParsedCommand;
  cwdBefore: string;
  cwdAfter: string;
  result: CommandResult;
}

/**
 * Did this one command solve the task? When the task has a state check, the
 * machine must say the job is done after the command, and the command must
 * be the thing that did it — either it matches the intent, or it changed
 * state, or the state was not done before. A learner who types an unrelated
 * command while the state happens to already be done does not get a pass.
 * Tasks without a state check (read-only jobs) keep intent matching.
 */
export function isTaskSolved(
  task: Pick<SandboxTask, "match" | "checkState">,
  session: ShellSession,
  stateBefore: boolean | null,
  ctx: AttemptContext,
): boolean {
  if (!task.checkState) return task.match(ctx.parsed, ctx.cwdBefore);
  const stateAfter = task.checkState(session, ctx.cwdAfter);
  if (!stateAfter) return false;
  if (stateBefore === false) return true;
  const changed = ctx.result.changed;
  const changedSomething =
    (changed?.paths.length ?? 0) > 0 || (changed?.created.length ?? 0) > 0 || (changed?.services.length ?? 0) > 0;
  return task.match(ctx.parsed, ctx.cwdBefore) || changedSomething;
}

// ---------------------------------------------------------------------------
// Readiness report — plain words, no score, no pass promise.
// ---------------------------------------------------------------------------

export interface CoachJobSummary {
  id: string;
  title: string;
  domain: string;
  status: "cold" | "helped" | "retest" | "not-yet";
}

export interface ReadinessReport {
  /** One plain-words line per job, in job order. */
  lines: string[];
  /** What to do next, in plain words. */
  nextStep: string;
  coldCount: number;
  totalCount: number;
}

export function readinessReport(
  jobs: Array<{ id: string; title: string; domain: string }>,
  progress: CoachProgress,
  now: number = Date.now(),
): ReadinessReport {
  const lines: string[] = [];
  let coldCount = 0;
  let firstWeak: { title: string; domain: string } | null = null;
  let firstRetest: { title: string } | null = null;

  for (const job of jobs) {
    const record = progress[job.id];
    if (!record || (record.coldPasses === 0 && !record.solvedWithHelp)) {
      lines.push(`You have not done "${job.title}" yet.`);
      firstWeak ??= job;
      continue;
    }
    if (isRetestDue(record, now)) {
      lines.push(`You did "${job.title}" cold once, but it is time to prove it again — the retest is due.`);
      firstRetest ??= job;
      continue;
    }
    if (record.coldPasses > 0) {
      coldCount += 1;
      lines.push(`You can do "${job.title}" on your own, with no help.`);
      continue;
    }
    lines.push(`You did "${job.title}" with help. You still need help with it.`);
    firstWeak ??= job;
  }

  const nextStep = firstRetest
    ? `Next job: do "${firstRetest.title}" again, cold, with no hints.`
    : firstWeak
      ? `Next job: "${firstWeak.title}" — that is the one to work on.`
      : "Every job is done cold. Pick a job and prove it again in three days.";

  return { lines, nextStep, coldCount, totalCount: jobs.length };
}

// ---------------------------------------------------------------------------
// Modes & Extreme mode — cold only, first try in session, 3-day lock + retest.
// ---------------------------------------------------------------------------

export type CoachMode = "easy" | "medium" | "hard" | "extreme";
export type ActiveCoachMode = CoachMode;

export const COACH_MODE_KEY = "coachMode";
export const EXTREME_STORAGE_KEY = "coachExtremeProgress";
export const MEDIUM_STORAGE_KEY = "coachMediumProgress";
export const EASY_STORAGE_KEY = "coachEasyProgress";

const DAY_MS = 24 * 60 * 60 * 1000;

export function loadCoachMode(): ActiveCoachMode {
  const saved = loadState<string>(COACH_MODE_KEY, "hard");
  if (saved === "easy" || saved === "medium" || saved === "extreme") return saved;
  return "hard";
}

export function saveCoachMode(mode: ActiveCoachMode): void {
  saveState(COACH_MODE_KEY, mode);
}

export type ExtremeStage = "not-done" | "awaiting-retest" | "complete";
export type ExtremeStatus = "not-done" | "locked" | "retest-due" | "complete";

export interface ExtremeJobRecord {
  /** Rounds attempted on this job in Extreme mode. */
  attempts: number;
  /** not-done -> awaiting-retest (locked 3d, then retest-due) -> complete. */
  stage: ExtremeStage;
  /** Epoch ms of the first cold pass, or null when not-done. */
  firstColdPassAt: number | null;
  /** Epoch ms when the 3-day lock lifts and the cold retest opens, or null. */
  nextRetestAt: number | null;
  /** Epoch ms when the 3-day cold retest was passed cold, or null. */
  completedAt: number | null;
  /** Reboot check passed on the solved round (jobs that require it). */
  rebootPassed: boolean;
}

export type ExtremeProgress = Record<string, ExtremeJobRecord>;

export function emptyExtremeJobRecord(): ExtremeJobRecord {
  return {
    attempts: 0,
    stage: "not-done",
    firstColdPassAt: null,
    nextRetestAt: null,
    completedAt: null,
    rebootPassed: false,
  };
}

export function loadExtremeProgress(): ExtremeProgress {
  return loadState<ExtremeProgress>(EXTREME_STORAGE_KEY, {});
}

export function saveExtremeProgress(progress: ExtremeProgress): void {
  saveState(EXTREME_STORAGE_KEY, progress);
}

export function extremeJobStatus(record: ExtremeJobRecord | undefined, now: number = Date.now()): ExtremeStatus {
  if (!record || record.stage === "not-done") return "not-done";
  if (record.stage === "complete") return "complete";
  if (record.nextRetestAt !== null && now < record.nextRetestAt) return "locked";
  return "retest-due";
}

export function lockRemainingWords(nextRetestAt: number | null, now: number = Date.now()): string {
  if (nextRetestAt === null || now >= nextRetestAt) return "zero days";
  const days = Math.ceil((nextRetestAt - now) / DAY_MS);
  if (days >= 3) return "three days";
  if (days === 2) return "two days";
  return "one day";
}

/**
 * Record an Extreme round outcome.
 * - Solved with 0 hints on the first try in this session:
 *   - From not-done -> locks for 3 days (awaiting-retest).
 *   - From retest-due (3+ days later) -> Extreme complete (proved cold twice).
 * - Failed retest, or any hint used -> resets back to not-done and restarts the 3-day clock.
 * - Locked jobs cannot advance before the 3-day lock expires.
 */
export function recordExtremeRound(
  progress: ExtremeProgress,
  jobId: string,
  outcome: { solved: boolean; hintsUsed: number; firstTryInSession: boolean; rebootPassed: boolean },
  now: number = Date.now(),
): ExtremeProgress {
  const record = progress[jobId] ?? emptyExtremeJobRecord();
  const status = extremeJobStatus(record, now);

  if (outcome.hintsUsed > 0) {
    return {
      ...progress,
      [jobId]: {
        ...emptyExtremeJobRecord(),
        attempts: record.attempts + 1,
      },
    };
  }

  if (status === "locked") {
    return progress;
  }

  const passedColdFirstTry = outcome.solved && outcome.hintsUsed === 0 && outcome.firstTryInSession;

  if (!passedColdFirstTry) {
    if (status === "complete") {
      return { ...progress, [jobId]: { ...record, attempts: record.attempts + 1 } };
    }
    return {
      ...progress,
      [jobId]: {
        ...emptyExtremeJobRecord(),
        attempts: record.attempts + 1,
      },
    };
  }

  if (status === "not-done") {
    return {
      ...progress,
      [jobId]: {
        attempts: record.attempts + 1,
        stage: "awaiting-retest",
        firstColdPassAt: now,
        nextRetestAt: now + COLD_RETEST_DAYS * DAY_MS,
        completedAt: null,
        rebootPassed: outcome.rebootPassed,
      },
    };
  }

  if (status === "retest-due") {
    return {
      ...progress,
      [jobId]: {
        ...record,
        attempts: record.attempts + 1,
        stage: "complete",
        nextRetestAt: null,
        completedAt: now,
        rebootPassed: record.rebootPassed || outcome.rebootPassed,
      },
    };
  }

  return {
    ...progress,
    [jobId]: {
      ...record,
      attempts: record.attempts + 1,
      rebootPassed: record.rebootPassed || outcome.rebootPassed,
    },
  };
}

/**
 * If the learner uses a hint or reveals a solution (for instance by switching
 * to Hard mode on that job), Extreme resets that job back to not-done so the
 * 3-day clock must restart from a fresh cold pass.
 */
export function recordExtremeHintUsed(progress: ExtremeProgress, jobId: string): ExtremeProgress {
  const record = progress[jobId];
  if (!record) return progress;
  return {
    ...progress,
    [jobId]: {
      ...emptyExtremeJobRecord(),
      attempts: record.attempts,
    },
  };
}

export function markExtremeRebootPassed(progress: ExtremeProgress, jobId: string): ExtremeProgress {
  const record = progress[jobId];
  if (!record) return progress;
  return { ...progress, [jobId]: { ...record, rebootPassed: true } };
}

/**
 * Returns true when an unsolved command in Extreme mode represents a wrong
 * task attempt (burning the learner's first try in this session), while
 * allowing harmless read-only inspection before acting on stateful jobs.
 */
export function didCommandBurnFirstTry(
  jobId: string,
  parsed: ParsedCommand,
  result: CommandResult,
  cwdAfter: string,
): boolean {
  if (!parsed.name || parsed.name === "help" || parsed.name === "clear") return false;
  if (result.unknown) return true;
  if (parsed.name === "reboot") return true;

  const isReadOnlyTar =
    parsed.name === "tar" &&
    parsed.shortFlags.has("t") &&
    !parsed.shortFlags.has("c") &&
    !parsed.shortFlags.has("x");
  const isReadOnlySystemctl =
    parsed.name === "systemctl" && parsed.args[0] === "status";
  const isReadOnlyService =
    parsed.name === "service" && parsed.args[1] === "status";
  const isReadOnlyCrontab =
    parsed.name === "crontab" && parsed.shortFlags.has("l") && parsed.args.length === 0;
  const isReadOnlyYum =
    (parsed.name === "yum" || parsed.name === "dnf") &&
    ["list", "info", "search"].includes(parsed.args[0] ?? "");

  const isMutatingTool =
    !isReadOnlyTar &&
    !isReadOnlySystemctl &&
    !isReadOnlyService &&
    !isReadOnlyCrontab &&
    !isReadOnlyYum &&
    ["chmod", "chown", "chgrp", "tar", "systemctl", "service", "rm", "mv", "cp", "mkdir", "touch", "kill", "yum", "dnf", "tee"].includes(
      parsed.name,
    );

  switch (jobId) {
    case "coach-website-down": {
      if ((parsed.name === "systemctl" && !isReadOnlySystemctl) || (parsed.name === "service" && !isReadOnlyService)) {
        const firstLine = result.output[0] ?? "";
        if (firstLine.startsWith("Usage:") || firstLine.includes("could not be found") || firstLine.includes("Unknown operation")) {
          return true;
        }
        const rawTokens = parsed.args;
        if (rawTokens.includes("stop") || rawTokens.includes("disable") || !rawTokens.some((t) => t.startsWith("nginx"))) {
          return true;
        }
        return false;
      }
      return isMutatingTool;
    }
    case "coach-ssh-key-server1": {
      if (result.exitCode !== 0) return true;
      if (parsed.name === "mv") {
        const movedKey =
          (result.changed?.created ?? []).includes("/home/user/.ssh/admin") ||
          (result.changed?.paths ?? []).includes("/home/user/.ssh/admin");
        return !movedKey;
      }
      if (parsed.name === "chmod") {
        const touchedKey = (result.changed?.paths ?? []).includes("/home/user/.ssh/admin");
        const modeOk = (result.output[0] ?? "").includes("600");
        return !(touchedKey && modeOk);
      }
      if (parsed.name === "chown") {
        const touchedKey = (result.changed?.paths ?? []).includes("/home/user/.ssh/admin");
        const ownerOk = (result.output[0] ?? "").includes("user");
        return !(touchedKey && ownerOk);
      }
      if (["echo", "printf", "cat", "tee"].includes(parsed.name)) {
        const allChanged = [...(result.changed?.paths ?? []), ...(result.changed?.created ?? [])];
        if (allChanged.length === 0) return false;
        return !allChanged.every((p) => p === "/home/user/.ssh/config");
      }
      return isMutatingTool;
    }
    case "coach-install-httpd": {
      if (result.exitCode !== 0) return true;
      if ((parsed.name === "yum" || parsed.name === "dnf") && !isReadOnlyYum) {
        return !(parsed.args.includes("install") && parsed.args.includes("httpd"));
      }
      if ((parsed.name === "systemctl" && !isReadOnlySystemctl) || (parsed.name === "service" && !isReadOnlyService)) {
        const rawTokens = parsed.args;
        if (rawTokens.includes("stop") || rawTokens.includes("disable") || !rawTokens.some((t) => t.startsWith("httpd"))) {
          return true;
        }
        return false;
      }
      return isMutatingTool;
    }
    case "coach-cron-down": {
      if ((parsed.name === "systemctl" && !isReadOnlySystemctl) || (parsed.name === "service" && !isReadOnlyService)) {
        if (result.exitCode !== 0) return true;
        const rawTokens = parsed.args;
        if (rawTokens.includes("stop") || rawTokens.includes("disable") || !rawTokens.some((t) => t.startsWith("cron"))) {
          return true;
        }
        return false;
      }
      return isMutatingTool;
    }
    case "coach-runaway-cpu": {
      // Polite SIGTERM on PID 4412 is the expected diagnostic/first step before escalating to SIGKILL (-9).
      if (parsed.name === "kill") {
        if (result.exitCode !== 0) return true;
        const pids = parsed.args.filter((a) => /^\d+$/.test(a));
        return !(pids.length === 1 && pids[0] === "4412");
      }
      return isMutatingTool;
    }
    case "coach-port-in-use": {
      // Stopping rogue PID 2847 is step 1 before starting httpd on port 80.
      if (parsed.name === "kill") {
        if (result.exitCode !== 0) return true;
        const pids = parsed.args.filter((a) => /^\d+$/.test(a));
        return !(pids.length === 1 && pids[0] === "2847");
      }
      return isMutatingTool;
    }
    case "coach-deleted-user-files": {
      if (parsed.name === "chown") {
        if (result.exitCode !== 0) return true;
        const changed = result.changed?.paths ?? [];
        return !changed.some((p) => p.startsWith("/srv/projects"));
      }
      return isMutatingTool;
    }
    case "coach-service-journal": {
      if (parsed.name === "chmod") {
        if (result.exitCode !== 0) return true;
        const changed = result.changed?.paths ?? [];
        return !changed.includes("/usr/sbin/nginx");
      }
      if ((parsed.name === "systemctl" && !isReadOnlySystemctl) || (parsed.name === "service" && !isReadOnlyService)) {
        if (result.exitCode !== 0) return true;
        const rawTokens = parsed.args;
        if (rawTokens.includes("stop") || rawTokens.includes("disable") || !rawTokens.some((t) => t.startsWith("nginx"))) {
          return true;
        }
        return false;
      }
      return isMutatingTool;
    }
    case "coach-script-not-found": {
      if (parsed.name === "chmod") {
        if (result.exitCode !== 0) return true;
        const changed = result.changed?.paths ?? [];
        return !changed.includes("/home/user/script.sh");
      }
      if (parsed.name === "hash") {
        return result.exitCode !== 0;
      }
      return isMutatingTool;
    }
    case "coach-verify-checksum": {
      if (parsed.name === "sha256sum") {
        return result.exitCode !== 0;
      }
      return isMutatingTool;
    }
    case "coach-restore-backup":
    case "coach-permission-denied":
    case "coach-disk-full":
    case "coach-inodes-gone":
    case "coach-sb-chmod-750":
    case "coach-sb-tar-create":
      return isMutatingTool;
    case "coach-sb-cd-logs":
      if (parsed.name === "cd") return cwdAfter !== "/var";
      return isMutatingTool;
    case "coach-sb-ls-la":
      return parsed.name === "ls" || isMutatingTool;
    case "coach-sb-find-large":
      return parsed.name === "find" || parsed.name === "du" || isMutatingTool;
    case "coach-sb-grep-recursive":
      return parsed.name === "grep" || isMutatingTool;
    case "coach-sb-ss-listen":
      return parsed.name === "ss" || parsed.name === "netstat" || isMutatingTool;
    case "coach-sb-cat-fstab":
      return ["cat", "less", "more", "head", "tail"].includes(parsed.name) || isMutatingTool;
    default:
      return isMutatingTool;
  }
}

export interface ExtremeReadinessReport {
  headline: string;
  lines: string[];
  nextStep: string;
  completeCount: number;
  lockedCount: number;
  retestDueCount: number;
  totalCount: number;
}

export function extremeReadinessReport(
  jobs: Array<{ id: string; title: string; domain: string }>,
  progress: ExtremeProgress,
  now: number = Date.now(),
): ExtremeReadinessReport {
  const lines: string[] = [];
  let completeCount = 0;
  let lockedCount = 0;
  let retestDueCount = 0;
  let firstRetest: { title: string } | null = null;
  let firstNotDone: { title: string } | null = null;

  for (const job of jobs) {
    const record = progress[job.id];
    const status = extremeJobStatus(record, now);
    if (status === "complete") {
      completeCount += 1;
      lines.push(`You proved "${job.title}" cold twice, three days apart.`);
      continue;
    }
    if (status === "retest-due") {
      retestDueCount += 1;
      firstRetest ??= job;
      lines.push(`The three-day wait is over for "${job.title}" — it needs a cold retest now, first try, with no hints.`);
      continue;
    }
    if (status === "locked") {
      lockedCount += 1;
      const waitWords = lockRemainingWords(record?.nextRetestAt ?? null, now);
      lines.push(
        `You passed "${job.title}" cold once. It is locked for ${waitWords} and needs a cold retest before it counts for Extreme.`,
      );
      continue;
    }
    firstNotDone ??= job;
    lines.push(`You have not done "${job.title}" cold in Extreme yet.`);
  }

  const headline = `Extreme: ${completeCount} of ${jobs.length} jobs proved cold twice.`;
  const nextStep = firstRetest
    ? `Next job in Extreme: retest "${firstRetest.title}" cold — first try, no hints.`
    : firstNotDone
      ? `Next job in Extreme: do "${firstNotDone.title}" cold — first try, no hints.`
      : lockedCount > 0
        ? "Every remaining Extreme job is locked for its three-day wait and needs a cold retest once the lock lifts."
        : "Every job in Extreme has been proved cold twice, three days apart.";

  return {
    headline,
    lines,
    nextStep,
    completeCount,
    lockedCount,
    retestDueCount,
    totalCount: jobs.length,
  };
}

// ---------------------------------------------------------------------------
// Medium mode — shadow typing + step-by-step plain-words coaching, no 3d lock.
// ---------------------------------------------------------------------------

export type MediumStoredStatus = "not-done" | "passed" | "hint-used" | "failed";
export type MediumJobStatus = "not-done" | "working" | "passed" | "hint-used" | "failed";

export interface MediumJobRecord {
  attempts: number;
  status: MediumStoredStatus;
  passedAt: number | null;
  rebootPassed: boolean;
}

export type MediumProgress = Record<string, MediumJobRecord>;

export function emptyMediumJobRecord(): MediumJobRecord {
  return {
    attempts: 0,
    status: "not-done",
    passedAt: null,
    rebootPassed: false,
  };
}

export function loadMediumProgress(): MediumProgress {
  return loadState<MediumProgress>(MEDIUM_STORAGE_KEY, {});
}

export function saveMediumProgress(progress: MediumProgress): void {
  saveState(MEDIUM_STORAGE_KEY, progress);
}

export function stepAtShadowIndex(plan: Pick<MediumStage, "target" | "steps">, index: number): MediumStep {
  const clamped = Math.min(Math.max(0, index), Math.max(0, plan.target.length - 1));
  return plan.steps.find((s) => clamped >= s.start && clamped < s.end) ?? plan.steps[plan.steps.length - 1];
}

export interface ShadowTypingResult {
  /** Accepted prefix matching `plan.target`. */
  typed: string;
  /** Untyped light-grey suffix (`plan.target.slice(typed.length)`). */
  remainingShadow: string;
  /** True when `typed` moved forward by at least one character. */
  advanced: boolean;
  /** True when an incorrect character was rejected without advancing. */
  blocked: boolean;
  /** True when `typed === plan.target`. */
  completed: boolean;
  /** Step corresponding to the current cursor position. */
  activeStep: MediumStep;
  /** Step whose part was mistyped when `blocked` is true, or null. */
  wrongStep: MediumStep | null;
  /** Plain-words coach message naming what part is wrong when `blocked` is true. */
  coachMessage: string | null;
}

/**
 * Process a keystroke or input update against the shadow target command.
 * Correct characters advance and fade the grey shadow; wrong characters do not
 * advance and return plain-words coaching about which part of the command is wrong.
 */
export function advanceShadowTyping(
  currentTyped: string,
  attemptedInput: string,
  plan: Pick<MediumStage, "target" | "steps">,
): ShadowTypingResult {
  const { target } = plan;

  // Backspace / deleting characters from the already-matched prefix
  if (attemptedInput.length <= currentTyped.length && target.startsWith(attemptedInput)) {
    const remainingShadow = target.slice(attemptedInput.length);
    return {
      typed: attemptedInput,
      remainingShadow,
      advanced: false,
      blocked: false,
      completed: attemptedInput === target,
      activeStep: stepAtShadowIndex(plan, attemptedInput.length),
      wrongStep: null,
      coachMessage: null,
    };
  }

  // Extra keystroke after the full shadow command is already complete
  if (currentTyped === target && attemptedInput.length > target.length && attemptedInput.startsWith(target)) {
    const lastStep = plan.steps[plan.steps.length - 1];
    return {
      typed: target,
      remainingShadow: "",
      advanced: false,
      blocked: true,
      completed: true,
      activeStep: lastStep,
      wrongStep: lastStep,
      coachMessage: "You have already typed the whole command over the shadow — press Enter to run it on the machine.",
    };
  }

  // Character-by-character verification from start of target
  let matchedLen = 0;
  while (matchedLen < attemptedInput.length && matchedLen < target.length && attemptedInput[matchedLen] === target[matchedLen]) {
    matchedLen += 1;
  }

  if (matchedLen < attemptedInput.length) {
    // Mismatch encountered: keep whichever valid prefix is further along, do not advance past mismatch
    const accepted = matchedLen > currentTyped.length ? target.slice(0, matchedLen) : currentTyped;
    const errIndex = accepted.length;
    const errStep = stepAtShadowIndex(plan, errIndex);
    const coachMessage =
      errIndex >= target.length
        ? "You have already typed the whole command over the shadow — press Enter to run it on the machine."
        : errStep.wrongKeyHint;

    return {
      typed: accepted,
      remainingShadow: target.slice(accepted.length),
      advanced: accepted.length > currentTyped.length,
      blocked: true,
      completed: accepted === target,
      activeStep: errStep,
      wrongStep: errStep,
      coachMessage,
    };
  }

  const accepted = target.slice(0, matchedLen);
  return {
    typed: accepted,
    remainingShadow: target.slice(accepted.length),
    advanced: accepted.length > currentTyped.length,
    blocked: false,
    completed: accepted === target,
    activeStep: stepAtShadowIndex(plan, accepted.length),
    wrongStep: null,
    coachMessage: null,
  };
}

export function recordMediumHintUsed(progress: MediumProgress, jobId: string): MediumProgress {
  const record = progress[jobId] ?? emptyMediumJobRecord();
  return {
    ...progress,
    [jobId]: {
      ...record,
      status: "hint-used",
      passedAt: null,
    },
  };
}

export function recordMediumRound(
  progress: MediumProgress,
  jobId: string,
  outcome: {
    solved: boolean;
    fullShadowTyped: boolean;
    hintsUsed: number;
    solutionShown: boolean;
    firstTryInSession: boolean;
    rebootPassed: boolean;
  },
  now: number = Date.now(),
): MediumProgress {
  const record = progress[jobId] ?? emptyMediumJobRecord();
  const usedHelp = outcome.hintsUsed > 0 || outcome.solutionShown;

  if (outcome.solved && outcome.fullShadowTyped && !usedHelp && outcome.firstTryInSession) {
    return {
      ...progress,
      [jobId]: {
        attempts: record.attempts + 1,
        status: "passed",
        passedAt: now,
        rebootPassed: outcome.rebootPassed,
      },
    };
  }

  if (usedHelp && outcome.solved) {
    return {
      ...progress,
      [jobId]: {
        attempts: record.attempts + 1,
        status: "hint-used",
        passedAt: null,
        rebootPassed: outcome.rebootPassed,
      },
    };
  }

  if (usedHelp) {
    return {
      ...progress,
      [jobId]: {
        attempts: record.attempts + 1,
        status: "hint-used",
        passedAt: null,
        rebootPassed: false,
      },
    };
  }

  return {
    ...progress,
    [jobId]: {
      attempts: record.attempts + 1,
      status: "failed",
      passedAt: null,
      rebootPassed: false,
    },
  };
}

export function markMediumRebootPassed(progress: MediumProgress, jobId: string): MediumProgress {
  const record = progress[jobId];
  if (!record) return progress;
  return { ...progress, [jobId]: { ...record, rebootPassed: true } };
}

export function resolveMediumUiStatus(
  stored: MediumJobRecord | undefined,
  active: {
    isCurrentJob: boolean;
    typingStarted: boolean;
    hintsUsed: number;
    solutionShown: boolean;
    roundFailed: boolean;
    roundSolved: boolean;
  },
): MediumJobStatus {
  const base: MediumStoredStatus = stored?.status ?? "not-done";
  if (!active.isCurrentJob) return base;
  if (active.roundFailed) return "failed";
  if (active.hintsUsed > 0 || active.solutionShown) return "hint-used";
  if (active.roundSolved) return base;
  if (active.typingStarted) return "working";
  return base;
}

export interface MediumReadinessReport {
  headline: string;
  lines: string[];
  nextStep: string;
  passCount: number;
  hintUsedCount: number;
  totalCount: number;
}

export function mediumReadinessReport(
  jobs: Array<{ id: string; title: string; domain: string }>,
  progress: MediumProgress,
): MediumReadinessReport {
  const lines: string[] = [];
  let passCount = 0;
  let hintUsedCount = 0;
  let firstUnpassed: { title: string } | null = null;

  for (const job of jobs) {
    const status = progress[job.id]?.status ?? "not-done";
    if (status === "passed") {
      passCount += 1;
      lines.push(`You typed "${job.title}" cleanly on your first try with no hints — Medium pass.`);
      continue;
    }
    firstUnpassed ??= job;
    if (status === "hint-used") {
      hintUsedCount += 1;
      lines.push(`You used a hint on "${job.title}" — hint used, so it does not count as a Medium pass.`);
      continue;
    }
    if (status === "failed") {
      lines.push(`Your last try on "${job.title}" did not finish cleanly — practice it again in a fresh session.`);
      continue;
    }
    lines.push(`You have not practiced "${job.title}" in Medium yet.`);
  }

  const headline = `Medium: ${passCount} of ${jobs.length} jobs passed.`;
  const nextStep = firstUnpassed
    ? `Next in Medium: type "${firstUnpassed.title}" over the shadow — first try, zero hints.`
    : "Every job is passed in Medium. Step up to Hard to solve them without the shadow.";

  return {
    headline,
    lines,
    nextStep,
    passCount,
    hintUsedCount,
    totalCount: jobs.length,
  };
}

// ---------------------------------------------------------------------------
// Easy mode — Scratch-style word blocks, plain-words meanings, no typing,
// hints allowed without blocking a pass, no 3-day lock, no cold-pass rule.
// ---------------------------------------------------------------------------

export type EasyJobStatus = "not-done" | "working" | "passed" | "hint-used" | "failed";

export interface EasyJobRecord {
  attempts: number;
  /** True once the learner built the right command, ran it, and passed the job check (even if hints were used). */
  passed: boolean;
  /** True when a hint or solution was used — shows yellow on the job while still counting as passed when `passed` is true. */
  hintUsed: boolean;
  /** True when the last attempt on an unpassed job failed. */
  lastFailed: boolean;
  passedAt: number | null;
  rebootPassed: boolean;
}

export type EasyProgress = Record<string, EasyJobRecord>;

export function emptyEasyJobRecord(): EasyJobRecord {
  return {
    attempts: 0,
    passed: false,
    hintUsed: false,
    lastFailed: false,
    passedAt: null,
    rebootPassed: false,
  };
}

export function loadEasyProgress(): EasyProgress {
  return loadState<EasyProgress>(EASY_STORAGE_KEY, {});
}

export function saveEasyProgress(progress: EasyProgress): void {
  saveState(EASY_STORAGE_KEY, progress);
}

export type EasyAttemptFailureReason = "incomplete" | "wrong-block" | "wrong-order";

export type EasyAttemptEvaluation =
  | {
      ok: true;
      command: string;
      audioKey: string;
      coachMessage: string;
    }
  | {
      ok: false;
      reason: EasyAttemptFailureReason;
      slotIndex: number;
      block: EasyBlock | null;
      audioKey: string;
      coachMessage: string;
    };

/**
 * Check the blocks currently sitting in the command tray.
 * - Missing slot -> names the empty slot and what belongs there.
 * - Distractor block -> explains in plain words what that block does and why it is wrong here.
 * - Right blocks in the wrong order -> explains which slot has the wrong part and why the order matters.
 * - All right -> returns the assembled shell command ready to run in the truthful shell.
 */
export function evaluateEasyAttempt(
  plan: Pick<EasyStagePlan, "blocks" | "slots" | "passMessage"> & { jobId?: string },
  placedBlockIds: ReadonlyArray<string | null | undefined>,
  options?: { jobId?: string; stageIndex?: number },
): EasyAttemptEvaluation {
  const jobId = options?.jobId ?? plan.jobId ?? "";
  const stagePrefix = options?.stageIndex && options.stageIndex > 0 ? `:s${options.stageIndex + 1}` : "";
  const blockById = new Map<string, EasyBlock>(plan.blocks.map((b) => [b.id, b]));
  const targetIds = new Set<string>(plan.slots.map((s) => s.expectedBlockId));

  for (let i = 0; i < plan.slots.length; i += 1) {
    const id = placedBlockIds[i];
    if (!id || !blockById.has(id)) {
      const slot = plan.slots[i];
      return {
        ok: false,
        reason: "incomplete",
        slotIndex: i,
        block: null,
        audioKey: `coach:easy:${jobId}${stagePrefix}:empty-slot-${slot.slotNumber}`,
        coachMessage: slot.emptySlotHint,
      };
    }
  }

  for (let i = 0; i < plan.slots.length; i += 1) {
    const block = blockById.get(placedBlockIds[i]!)!;
    if (!targetIds.has(block.id)) {
      return {
        ok: false,
        reason: "wrong-block",
        slotIndex: i,
        block,
        audioKey: `coach:easy:${jobId}${stagePrefix}:wrong-block-${block.id}`,
        coachMessage: block.wrongWhy ?? `${block.token} does not fit this job — swap in another block.`,
      };
    }
  }

  for (let i = 0; i < plan.slots.length; i += 1) {
    const slot = plan.slots[i];
    const block = blockById.get(placedBlockIds[i]!)!;
    if (block.id !== slot.expectedBlockId) {
      const msg =
        slot.wrongOrderByBlockId[block.id] ??
        `Order mix-up in slot ${slot.slotNumber}: ${block.token} belongs in a different slot.`;
      return {
        ok: false,
        reason: "wrong-order",
        slotIndex: i,
        block,
        audioKey: `coach:easy:${jobId}${stagePrefix}:wrong-order-${slot.slotNumber}-${block.id}`,
        coachMessage: msg,
      };
    }
  }

  const command = plan.slots.map((_, i) => blockById.get(placedBlockIds[i]!)!.token).join(" ");
  return {
    ok: true,
    command,
    audioKey: `coach:easy:${jobId}${stagePrefix}:pass`,
    coachMessage: plan.passMessage,
  };
}

/** Swap two slot positions in a command tray array (pure helper for drag/tap reordering). */
export function swapEasySlots(slots: ReadonlyArray<string | null>, fromIndex: number, toIndex: number): Array<string | null> {
  const next = [...slots];
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= next.length || toIndex >= next.length || fromIndex === toIndex) {
    return next;
  }
  const tmp = next[fromIndex];
  next[fromIndex] = next[toIndex];
  next[toIndex] = tmp;
  return next;
}

export function recordEasyHintUsed(progress: EasyProgress, jobId: string): EasyProgress {
  const record = progress[jobId] ?? emptyEasyJobRecord();
  return {
    ...progress,
    [jobId]: {
      ...record,
      hintUsed: true,
      lastFailed: false,
    },
  };
}

export function recordEasyRound(
  progress: EasyProgress,
  jobId: string,
  outcome: {
    solved: boolean;
    hintsUsed: number;
    solutionShown: boolean;
    rebootPassed: boolean;
  },
  now: number = Date.now(),
): EasyProgress {
  const record = progress[jobId] ?? emptyEasyJobRecord();
  const usedHelp = outcome.hintsUsed > 0 || outcome.solutionShown;

  if (outcome.solved) {
    return {
      ...progress,
      [jobId]: {
        attempts: record.attempts + 1,
        passed: true,
        hintUsed: usedHelp,
        lastFailed: false,
        passedAt: now,
        rebootPassed: record.rebootPassed || outcome.rebootPassed,
      },
    };
  }

  // Wrong attempt in Easy: no penalty if already passed; otherwise mark lastFailed until they swap & retry.
  if (record.passed) {
    return {
      ...progress,
      [jobId]: {
        ...record,
        attempts: record.attempts + 1,
      },
    };
  }

  return {
    ...progress,
    [jobId]: {
      ...record,
      attempts: record.attempts + 1,
      hintUsed: record.hintUsed || usedHelp,
      lastFailed: true,
    },
  };
}

export function markEasyRebootPassed(progress: EasyProgress, jobId: string): EasyProgress {
  const record = progress[jobId];
  if (!record) return progress;
  return { ...progress, [jobId]: { ...record, rebootPassed: true } };
}

export function resolveEasyUiStatus(
  stored: EasyJobRecord | undefined,
  active: {
    isCurrentJob: boolean;
    blocksTouched: boolean;
    hintsUsed: number;
    solutionShown: boolean;
    lastTryFailed: boolean;
    roundSolved: boolean;
  },
): EasyJobStatus {
  const storedStatus: EasyJobStatus = stored?.passed
    ? stored.hintUsed
      ? "hint-used"
      : "passed"
    : stored?.hintUsed
      ? "hint-used"
      : stored?.lastFailed
        ? "failed"
        : "not-done";

  if (!active.isCurrentJob) return storedStatus;
  if (active.lastTryFailed) return "failed";
  if (active.roundSolved) {
    return active.hintsUsed > 0 || active.solutionShown || stored?.hintUsed ? "hint-used" : "passed";
  }
  if (active.hintsUsed > 0 || active.solutionShown) return "hint-used";
  if (active.blocksTouched) return "working";
  return storedStatus;
}

export interface EasyReadinessReport {
  headline: string;
  lines: string[];
  nextStep: string;
  passCount: number;
  hintPassCount: number;
  totalCount: number;
}

export function easyReadinessReport(
  jobs: Array<{ id: string; title: string; domain: string }>,
  progress: EasyProgress,
): EasyReadinessReport {
  const lines: string[] = [];
  let passCount = 0;
  let hintPassCount = 0;
  let firstUnpassed: { title: string } | null = null;

  for (const job of jobs) {
    const record = progress[job.id];
    if (record?.passed) {
      passCount += 1;
      if (record.hintUsed) {
        hintPassCount += 1;
        lines.push(
          `You built and ran "${job.title}" with a hint — marked yellow (hint used), and still counts as an Easy pass.`,
        );
      } else {
        lines.push(`You built and ran "${job.title}" from word blocks — Easy pass.`);
      }
      continue;
    }

    firstUnpassed ??= job;
    if (record?.hintUsed) {
      lines.push(`You opened a hint on "${job.title}" — finish arranging the blocks and tap Run to pass it.`);
      continue;
    }
    if (record?.lastFailed) {
      lines.push(`Your last block order on "${job.title}" needed a swap — swap the blocks and tap Run to pass it.`);
      continue;
    }
    lines.push(`You have not built "${job.title}" in Easy yet.`);
  }

  const headline = `Easy: ${passCount} of ${jobs.length} jobs passed.`;
  const nextStep = firstUnpassed
    ? `Next in Easy: build "${firstUnpassed.title}" from word blocks and tap Run — hints are allowed.`
    : "Every job is passed in Easy. Step up to Medium to practice typing the commands over the shadow.";

  return {
    headline,
    lines,
    nextStep,
    passCount,
    hintPassCount,
    totalCount: jobs.length,
  };
}
