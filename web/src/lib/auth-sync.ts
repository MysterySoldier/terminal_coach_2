import type {
  CoachJobRecord,
  CoachProgress,
  EasyJobRecord,
  EasyProgress,
  ExtremeJobRecord,
  ExtremeProgress,
  ExtremeStage,
  MediumJobRecord,
  MediumProgress,
  MediumStoredStatus,
} from "@/lib/coach";
import {
  loadCoachProgress,
  loadEasyProgress,
  loadExtremeProgress,
  loadMediumProgress,
  saveCoachProgress,
  saveEasyProgress,
  saveExtremeProgress,
  saveMediumProgress,
  withSuppressedProgressEvent,
} from "@/lib/coach";
import type { AllProgressSnapshot } from "@/lib/mode-metrics";
import { loadState, saveState, clearState } from "@/lib/storage";

/**
 * Auth, Profile, Prompt Name, and Cloud Progress Sync (merge-by-best).
 *
 * - Stores the minimum: Google account id (`googleId`), `displayName` (plus optional
 *   Google `familyName` so the learner can switch to their Google last name anytime),
 *   and progress across all 4 modes. Never stores or displays an email address.
 * - Guests (not signed in) keep `user@coach:~$` and full local progress.
 * - First sign-in offers to keep local guest progress and merge it into the account
 *   (merge-by-best: a pass on any device counts everywhere; never overwrites a pass
 *   with a not-passed state).
 * - Sign-out keeps the local copy of progress on the device.
 */

export const AUTH_USER_STORAGE_KEY = "coachAuthUser";
export const PENDING_SYNC_STORAGE_KEY = "coachPendingCloudSync";
export const LOCAL_CLOUD_MIRROR_KEY = "coachCloudAccountsMirror";

/**
 * Origins registered/supported for Google Identity Services OAuth 2.0.
 * Adding `https://coach.mysterylabs.dev` in Google Cloud Console later
 * requires zero code change.
 */
export const ALLOWED_AUTH_ORIGINS: ReadonlyArray<string> = [
  "https://mysterylabs-coach-2.pages.dev",
  "https://mysterylabs-coach.pages.dev",
  "https://coach.mysterylabs.dev",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

export interface CoachAccountProfile {
  /** Minimum account identifier from Google (`sub`). Never an email address. */
  googleId: string;
  /** Prompt-safe custom display name or Google name (e.g., `MysterySoldier`). */
  displayName: string;
  /** Optional Google last name (`family_name`) so the user can one-tap use their last name. */
  familyName?: string;
}

export interface CloudAccountPayload {
  googleId: string;
  displayName: string;
  familyName: string;
  promptColor: string;
  commandColor: string;
  progress: AllProgressSnapshot;
  updatedAt: number;
}

/**
 * Sanitize a display name for the shell prompt (`<name>@coach:~$`):
 * - Keep only letters (`a-z`, `A-Z`), numbers (`0-9`), underscore (`_`), and hyphen (`-`).
 * - Preserve the exact case the user typed.
 * - Fall back to `"user"` when empty.
 */
export function sanitizePromptName(raw: string | null | undefined, fallback = "user"): string {
  if (!raw) return fallback;
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Resolve the active username shown before `@coach` in the terminal prompt.
 * Guests (not signed in) always see `user`. Signed-in users see their sanitized display name.
 */
export function resolvePromptUsername(account: CoachAccountProfile | null | undefined): string {
  if (!account || !account.googleId) return "user";
  return sanitizePromptName(account.displayName, "user");
}

/**
 * Format the full terminal prompt for a given working directory and user.
 * Example: `MysterySoldier@coach:~$` or `user@coach:/var/log$`.
 */
export function formatTerminalPrompt(cwd: string, username = "user", homeDir = "/home/user"): string {
  const safeUser = sanitizePromptName(username, "user");
  const displayCwd = cwd === homeDir ? "~" : cwd;
  return `${safeUser}@coach:${displayCwd}$`;
}

export function loadAuthAccount(): CoachAccountProfile | null {
  const saved = loadState<CoachAccountProfile | null>(AUTH_USER_STORAGE_KEY, null);
  if (!saved || typeof saved.googleId !== "string" || !saved.googleId.trim()) {
    return null;
  }
  return {
    googleId: saved.googleId.trim(),
    displayName: sanitizePromptName(saved.displayName, "user"),
    familyName: saved.familyName ? sanitizePromptName(saved.familyName, "") : "",
  };
}

export function saveAuthAccount(account: CoachAccountProfile | null): void {
  if (!account) {
    clearState(AUTH_USER_STORAGE_KEY);
    return;
  }
  saveState(AUTH_USER_STORAGE_KEY, {
    googleId: account.googleId.trim(),
    displayName: sanitizePromptName(account.displayName, "user"),
    familyName: account.familyName ? sanitizePromptName(account.familyName, "") : "",
  });
}

// ---------------------------------------------------------------------------
// Merge-by-best across all four modes (Easy / Medium / Hard / Extreme)
// ---------------------------------------------------------------------------

function maxNullableNumber(a: number | null | undefined, b: number | null | undefined): number | null {
  if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
  if (typeof a === "number") return a;
  if (typeof b === "number") return b;
  return null;
}

function minNullableNumber(a: number | null | undefined, b: number | null | undefined): number | null {
  if (typeof a === "number" && typeof b === "number") return Math.min(a, b);
  if (typeof a === "number") return a;
  if (typeof b === "number") return b;
  return null;
}

export function mergeEasyRecord(a: EasyJobRecord | undefined, b: EasyJobRecord | undefined): EasyJobRecord {
  if (!a && !b) {
    return {
      attempts: 0,
      passed: false,
      hintUsed: false,
      lastFailed: false,
      passedAt: null,
      rebootPassed: false,
    };
  }
  if (!a) return { ...b! };
  if (!b) return { ...a };

  const passed = Boolean(a.passed || b.passed);
  // If both devices passed, a clean pass (no hint) on either device wins.
  const hintUsed =
    a.passed && b.passed
      ? Boolean(a.hintUsed && b.hintUsed)
      : a.passed
        ? Boolean(a.hintUsed)
        : b.passed
          ? Boolean(b.hintUsed)
          : Boolean(a.hintUsed || b.hintUsed);

  return {
    attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
    passed,
    hintUsed,
    lastFailed: passed ? false : Boolean(a.lastFailed || b.lastFailed),
    passedAt: maxNullableNumber(a.passedAt, b.passedAt),
    rebootPassed: Boolean(a.rebootPassed || b.rebootPassed),
  };
}

const MEDIUM_STATUS_RANK: Record<MediumStoredStatus, number> = {
  "not-done": 0,
  failed: 1,
  "hint-used": 2,
  passed: 3,
};

export function mergeMediumRecord(a: MediumJobRecord | undefined, b: MediumJobRecord | undefined): MediumJobRecord {
  if (!a && !b) {
    return {
      attempts: 0,
      status: "not-done",
      passedAt: null,
      rebootPassed: false,
    };
  }
  if (!a) return { ...b! };
  if (!b) return { ...a };

  const statusA: MediumStoredStatus = a.status ?? "not-done";
  const statusB: MediumStoredStatus = b.status ?? "not-done";
  const bestStatus = MEDIUM_STATUS_RANK[statusA] >= MEDIUM_STATUS_RANK[statusB] ? statusA : statusB;

  return {
    attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
    status: bestStatus,
    passedAt: bestStatus === "passed" ? maxNullableNumber(a.passedAt, b.passedAt) : null,
    rebootPassed: Boolean(a.rebootPassed || b.rebootPassed),
  };
}

export function mergeHardRecord(a: CoachJobRecord | undefined, b: CoachJobRecord | undefined): CoachJobRecord {
  if (!a && !b) {
    return {
      attempts: 0,
      coldPasses: 0,
      solvedWithHelp: false,
      lastColdPassAt: null,
      nextRetestAt: null,
      rebootPassed: false,
    };
  }
  if (!a) return { ...b! };
  if (!b) return { ...a };

  const coldPasses = Math.max(a.coldPasses ?? 0, b.coldPasses ?? 0);
  const aPassAt = a.lastColdPassAt ?? 0;
  const bPassAt = b.lastColdPassAt ?? 0;
  const newer = aPassAt >= bPassAt ? a : b;
  const older = aPassAt >= bPassAt ? b : a;

  return {
    attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
    coldPasses,
    solvedWithHelp: Boolean(a.solvedWithHelp || b.solvedWithHelp),
    lastColdPassAt: newer.lastColdPassAt ?? older.lastColdPassAt ?? null,
    nextRetestAt: newer.nextRetestAt ?? older.nextRetestAt ?? null,
    rebootPassed: Boolean(a.rebootPassed || b.rebootPassed),
  };
}

const EXTREME_STAGE_RANK: Record<ExtremeStage, number> = {
  "not-done": 0,
  "awaiting-retest": 1,
  complete: 2,
};

export function mergeExtremeRecord(a: ExtremeJobRecord | undefined, b: ExtremeJobRecord | undefined): ExtremeJobRecord {
  if (!a && !b) {
    return {
      attempts: 0,
      stage: "not-done",
      firstColdPassAt: null,
      nextRetestAt: null,
      completedAt: null,
      rebootPassed: false,
    };
  }
  if (!a) return { ...b! };
  if (!b) return { ...a };

  const stageA: ExtremeStage = a.stage ?? "not-done";
  const stageB: ExtremeStage = b.stage ?? "not-done";
  const bestStage = EXTREME_STAGE_RANK[stageA] >= EXTREME_STAGE_RANK[stageB] ? stageA : stageB;

  if (bestStage === "complete") {
    return {
      attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
      stage: "complete",
      firstColdPassAt: minNullableNumber(a.firstColdPassAt, b.firstColdPassAt),
      nextRetestAt: null,
      completedAt: maxNullableNumber(a.completedAt, b.completedAt),
      rebootPassed: Boolean(a.rebootPassed || b.rebootPassed),
    };
  }

  if (bestStage === "awaiting-retest") {
    // Preserve the 3-day lock and retest schedule from whichever side achieved it (preferring earlier lock so wait time isn't reset).
    const firstColdPassAt =
      stageA === "awaiting-retest" && stageB === "awaiting-retest"
        ? minNullableNumber(a.firstColdPassAt, b.firstColdPassAt)
        : stageA === "awaiting-retest"
          ? a.firstColdPassAt
          : b.firstColdPassAt;
    const nextRetestAt =
      stageA === "awaiting-retest" && stageB === "awaiting-retest"
        ? minNullableNumber(a.nextRetestAt, b.nextRetestAt)
        : stageA === "awaiting-retest"
          ? a.nextRetestAt
          : b.nextRetestAt;
    return {
      attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
      stage: "awaiting-retest",
      firstColdPassAt,
      nextRetestAt,
      completedAt: null,
      rebootPassed: Boolean(a.rebootPassed || b.rebootPassed),
    };
  }

  return {
    attempts: Math.max(a.attempts ?? 0, b.attempts ?? 0),
    stage: "not-done",
    firstColdPassAt: null,
    nextRetestAt: null,
    completedAt: null,
    rebootPassed: Boolean(a.rebootPassed || b.rebootPassed),
  };
}

export function mergeEasyProgress(a: EasyProgress = {}, b: EasyProgress = {}): EasyProgress {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: EasyProgress = {};
  for (const k of keys) {
    out[k] = mergeEasyRecord(a[k], b[k]);
  }
  return out;
}

export function mergeMediumProgress(a: MediumProgress = {}, b: MediumProgress = {}): MediumProgress {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: MediumProgress = {};
  for (const k of keys) {
    out[k] = mergeMediumRecord(a[k], b[k]);
  }
  return out;
}

export function mergeHardProgress(a: CoachProgress = {}, b: CoachProgress = {}): CoachProgress {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: CoachProgress = {};
  for (const k of keys) {
    out[k] = mergeHardRecord(a[k], b[k]);
  }
  return out;
}

export function mergeExtremeProgress(a: ExtremeProgress = {}, b: ExtremeProgress = {}): ExtremeProgress {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: ExtremeProgress = {};
  for (const k of keys) {
    out[k] = mergeExtremeRecord(a[k], b[k]);
  }
  return out;
}

/**
 * Merge two full 4-mode progress snapshots by best outcome per job.
 * A pass on any device counts everywhere; never overwrites a pass with a not-passed state.
 */
export function mergeAllProgress(
  local: Partial<AllProgressSnapshot> | null | undefined,
  remote: Partial<AllProgressSnapshot> | null | undefined,
): AllProgressSnapshot {
  return {
    easy: mergeEasyProgress(local?.easy ?? {}, remote?.easy ?? {}),
    medium: mergeMediumProgress(local?.medium ?? {}, remote?.medium ?? {}),
    hard: mergeHardProgress(local?.hard ?? {}, remote?.hard ?? {}),
    extreme: mergeExtremeProgress(local?.extreme ?? {}, remote?.extreme ?? {}),
  };
}

export function hasAnyLocalProgress(snapshot?: AllProgressSnapshot): boolean {
  const snap = snapshot ?? {
    easy: loadEasyProgress(),
    medium: loadMediumProgress(),
    hard: loadCoachProgress(),
    extreme: loadExtremeProgress(),
  };
  return (
    Object.values(snap.easy).some((r) => r.attempts > 0 || r.passed) ||
    Object.values(snap.medium).some((r) => r.attempts > 0 || r.status !== "not-done") ||
    Object.values(snap.hard).some((r) => r.attempts > 0 || r.coldPasses > 0 || r.solvedWithHelp) ||
    Object.values(snap.extreme).some((r) => r.attempts > 0 || r.stage !== "not-done")
  );
}

export function saveAllLocalProgress(snapshot: AllProgressSnapshot): void {
  withSuppressedProgressEvent(() => {
    saveEasyProgress(snapshot.easy);
    saveMediumProgress(snapshot.medium);
    saveCoachProgress(snapshot.hard);
    saveExtremeProgress(snapshot.extreme);
  });
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("coach:progress-synced"));
  }
}

export function loadAllLocalProgress(): AllProgressSnapshot {
  return {
    easy: loadEasyProgress(),
    medium: loadMediumProgress(),
    hard: loadCoachProgress(),
    extreme: loadExtremeProgress(),
  };
}

// ---------------------------------------------------------------------------
// Local mirror + Cloud API (`/api/auth/google` and `/api/sync`)
// ---------------------------------------------------------------------------

function loadLocalCloudMirror(): Record<string, CloudAccountPayload> {
  return loadState<Record<string, CloudAccountPayload>>(LOCAL_CLOUD_MIRROR_KEY, {});
}

function saveLocalCloudMirror(mirror: Record<string, CloudAccountPayload>): void {
  saveState(LOCAL_CLOUD_MIRROR_KEY, mirror);
}

export function upsertLocalCloudMirror(payload: CloudAccountPayload): CloudAccountPayload {
  const mirror = loadLocalCloudMirror();
  const existing = mirror[payload.googleId];
  const mergedProgress = mergeAllProgress(existing?.progress, payload.progress);
  const resolvedDisplayName =
    payload.displayName && payload.displayName !== "user"
      ? sanitizePromptName(payload.displayName, "user")
      : sanitizePromptName(existing?.displayName || payload.displayName, "user");
  const next: CloudAccountPayload = {
    googleId: payload.googleId,
    displayName: resolvedDisplayName,
    familyName: sanitizePromptName(payload.familyName || existing?.familyName || "", ""),
    promptColor: payload.promptColor ? payload.promptColor : (existing?.promptColor ?? ""),
    commandColor: payload.commandColor ? payload.commandColor : (existing?.commandColor ?? ""),
    progress: mergedProgress,
    updatedAt: Date.now(),
  };
  mirror[payload.googleId] = next;
  saveLocalCloudMirror(mirror);
  return next;
}

export function getLocalCloudMirrorAccount(googleId: string): CloudAccountPayload | null {
  const mirror = loadLocalCloudMirror();
  return mirror[googleId] ?? null;
}

export interface SyncRequestPayload {
  googleId: string;
  displayName?: string;
  familyName?: string;
  promptColor?: string;
  commandColor?: string;
  progress: AllProgressSnapshot;
  mergeLocal?: boolean;
}

/**
 * Sync account + progress with Cloudflare Pages Functions + D1 (`/api/sync`),
 * falling back gracefully when offline or in a static preview environment.
 */
export async function syncWithCloud(req: SyncRequestPayload): Promise<{
  ok: boolean;
  account: CloudAccountPayload;
  fromCloud: boolean;
}> {
  const safeGoogleId = req.googleId.trim();
  const baseLocalProgress = req.mergeLocal === false ? { easy: {}, medium: {}, hard: {}, extreme: {} } : req.progress;
  const mirrorExisting = getLocalCloudMirrorAccount(safeGoogleId);

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    saveState(PENDING_SYNC_STORAGE_KEY, true);
    const offlineAccount = upsertLocalCloudMirror({
      googleId: safeGoogleId,
      displayName: sanitizePromptName(req.displayName ?? mirrorExisting?.displayName, "user"),
      familyName: sanitizePromptName(req.familyName ?? mirrorExisting?.familyName ?? "", ""),
      promptColor: req.promptColor ?? mirrorExisting?.promptColor ?? "",
      commandColor: req.commandColor ?? mirrorExisting?.commandColor ?? "",
      progress: mergeAllProgress(baseLocalProgress, mirrorExisting?.progress),
      updatedAt: Date.now(),
    });
    return { ok: false, account: offlineAccount, fromCloud: false };
  }

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleId: safeGoogleId,
        displayName: req.displayName,
        familyName: req.familyName,
        promptColor: req.promptColor,
        commandColor: req.commandColor,
        progress: baseLocalProgress,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { account?: CloudAccountPayload };
      if (data?.account && data.account.googleId) {
        const merged = upsertLocalCloudMirror({
          ...data.account,
          progress: mergeAllProgress(baseLocalProgress, data.account.progress),
        });
        saveState(PENDING_SYNC_STORAGE_KEY, false);
        return { ok: true, account: merged, fromCloud: true };
      }
    }
  } catch {
    // Offline or local static server without Pages Functions worker running
  }

  saveState(PENDING_SYNC_STORAGE_KEY, true);
  const fallbackAccount = upsertLocalCloudMirror({
    googleId: safeGoogleId,
    displayName: sanitizePromptName(req.displayName ?? mirrorExisting?.displayName, "user"),
    familyName: sanitizePromptName(req.familyName ?? mirrorExisting?.familyName ?? "", ""),
    promptColor: req.promptColor ?? mirrorExisting?.promptColor ?? "",
    commandColor: req.commandColor ?? mirrorExisting?.commandColor ?? "",
    progress: mergeAllProgress(baseLocalProgress, mirrorExisting?.progress),
    updatedAt: Date.now(),
  });
  return { ok: false, account: fallbackAccount, fromCloud: false };
}
