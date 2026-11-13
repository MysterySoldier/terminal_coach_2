export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface PagesEnv {
  DB?: D1Database;
  GOOGLE_CLIENT_ID?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
}

export const ALLOWED_AUTH_ORIGINS = [
  "https://mysterylabs-coach.pages.dev",
  "https://coach.mysterylabs.dev",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin =
    origin &&
    (ALLOWED_AUTH_ORIGINS.includes(origin) ||
      origin.endsWith(".mysterylabs-coach.pages.dev") ||
      origin.endsWith(".mysterylabs.dev"))
      ? origin
      : "https://mysterylabs-coach.pages.dev";
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };
}

export function sanitizePromptName(raw: unknown, fallback = "user"): string {
  if (typeof raw !== "string" || !raw) return fallback;
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function sanitizeHexColor(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : "";
}

function maxNum(a: unknown, b: unknown): number | null {
  const na = typeof a === "number" ? a : null;
  const nb = typeof b === "number" ? b : null;
  if (na !== null && nb !== null) return Math.max(na, nb);
  return na ?? nb;
}

function minNum(a: unknown, b: unknown): number | null {
  const na = typeof a === "number" ? a : null;
  const nb = typeof b === "number" ? b : null;
  if (na !== null && nb !== null) return Math.min(na, nb);
  return na ?? nb;
}

const MEDIUM_RANK: Record<string, number> = {
  "not-done": 0,
  failed: 1,
  "hint-used": 2,
  passed: 3,
};

const EXTREME_RANK: Record<string, number> = {
  "not-done": 0,
  "awaiting-retest": 1,
  complete: 2,
};

export function mergeProgressSnapshots(
  aRaw: Record<string, unknown> | null | undefined,
  bRaw: Record<string, unknown> | null | undefined,
): Record<string, Record<string, unknown>> {
  const a = aRaw && typeof aRaw === "object" ? aRaw : {};
  const b = bRaw && typeof bRaw === "object" ? bRaw : {};

  const aEasy = (a.easy && typeof a.easy === "object" ? a.easy : {}) as Record<string, Record<string, unknown>>;
  const bEasy = (b.easy && typeof b.easy === "object" ? b.easy : {}) as Record<string, Record<string, unknown>>;
  const easyKeys = new Set([...Object.keys(aEasy), ...Object.keys(bEasy)]);
  const easy: Record<string, unknown> = {};
  for (const k of easyKeys) {
    const ra = aEasy[k];
    const rb = bEasy[k];
    if (!ra) {
      easy[k] = rb;
      continue;
    }
    if (!rb) {
      easy[k] = ra;
      continue;
    }
    const passed = Boolean(ra.passed || rb.passed);
    const hintUsed =
      ra.passed && rb.passed
        ? Boolean(ra.hintUsed && rb.hintUsed)
        : ra.passed
          ? Boolean(ra.hintUsed)
          : rb.passed
            ? Boolean(rb.hintUsed)
            : Boolean(ra.hintUsed || rb.hintUsed);
    easy[k] = {
      attempts: Math.max(Number(ra.attempts ?? 0), Number(rb.attempts ?? 0)),
      passed,
      hintUsed,
      lastFailed: passed ? false : Boolean(ra.lastFailed || rb.lastFailed),
      passedAt: maxNum(ra.passedAt, rb.passedAt),
      rebootPassed: Boolean(ra.rebootPassed || rb.rebootPassed),
    };
  }

  const aMed = (a.medium && typeof a.medium === "object" ? a.medium : {}) as Record<string, Record<string, unknown>>;
  const bMed = (b.medium && typeof b.medium === "object" ? b.medium : {}) as Record<string, Record<string, unknown>>;
  const medKeys = new Set([...Object.keys(aMed), ...Object.keys(bMed)]);
  const medium: Record<string, unknown> = {};
  for (const k of medKeys) {
    const ra = aMed[k];
    const rb = bMed[k];
    if (!ra) {
      medium[k] = rb;
      continue;
    }
    if (!rb) {
      medium[k] = ra;
      continue;
    }
    const sa = String(ra.status ?? "not-done");
    const sb = String(rb.status ?? "not-done");
    const best = (MEDIUM_RANK[sa] ?? 0) >= (MEDIUM_RANK[sb] ?? 0) ? sa : sb;
    medium[k] = {
      attempts: Math.max(Number(ra.attempts ?? 0), Number(rb.attempts ?? 0)),
      status: best,
      passedAt: best === "passed" ? maxNum(ra.passedAt, rb.passedAt) : null,
      rebootPassed: Boolean(ra.rebootPassed || rb.rebootPassed),
    };
  }

  const aHard = (a.hard && typeof a.hard === "object" ? a.hard : {}) as Record<string, Record<string, unknown>>;
  const bHard = (b.hard && typeof b.hard === "object" ? b.hard : {}) as Record<string, Record<string, unknown>>;
  const hardKeys = new Set([...Object.keys(aHard), ...Object.keys(bHard)]);
  const hard: Record<string, unknown> = {};
  for (const k of hardKeys) {
    const ra = aHard[k];
    const rb = bHard[k];
    if (!ra) {
      hard[k] = rb;
      continue;
    }
    if (!rb) {
      hard[k] = ra;
      continue;
    }
    const newer = Number(ra.lastColdPassAt ?? 0) >= Number(rb.lastColdPassAt ?? 0) ? ra : rb;
    const older = newer === ra ? rb : ra;
    hard[k] = {
      attempts: Math.max(Number(ra.attempts ?? 0), Number(rb.attempts ?? 0)),
      coldPasses: Math.max(Number(ra.coldPasses ?? 0), Number(rb.coldPasses ?? 0)),
      solvedWithHelp: Boolean(ra.solvedWithHelp || rb.solvedWithHelp),
      lastColdPassAt: newer.lastColdPassAt ?? older.lastColdPassAt ?? null,
      nextRetestAt: newer.nextRetestAt ?? older.nextRetestAt ?? null,
      rebootPassed: Boolean(ra.rebootPassed || rb.rebootPassed),
    };
  }

  const aExt = (a.extreme && typeof a.extreme === "object" ? a.extreme : {}) as Record<string, Record<string, unknown>>;
  const bExt = (b.extreme && typeof b.extreme === "object" ? b.extreme : {}) as Record<string, Record<string, unknown>>;
  const extKeys = new Set([...Object.keys(aExt), ...Object.keys(bExt)]);
  const extreme: Record<string, unknown> = {};
  for (const k of extKeys) {
    const ra = aExt[k];
    const rb = bExt[k];
    if (!ra) {
      extreme[k] = rb;
      continue;
    }
    if (!rb) {
      extreme[k] = ra;
      continue;
    }
    const sa = String(ra.stage ?? "not-done");
    const sb = String(rb.stage ?? "not-done");
    const best = (EXTREME_RANK[sa] ?? 0) >= (EXTREME_RANK[sb] ?? 0) ? sa : sb;
    if (best === "complete") {
      extreme[k] = {
        attempts: Math.max(Number(ra.attempts ?? 0), Number(rb.attempts ?? 0)),
        stage: "complete",
        firstColdPassAt: minNum(ra.firstColdPassAt, rb.firstColdPassAt),
        nextRetestAt: null,
        completedAt: maxNum(ra.completedAt, rb.completedAt),
        rebootPassed: Boolean(ra.rebootPassed || rb.rebootPassed),
      };
    } else if (best === "awaiting-retest") {
      const firstColdPassAt =
        sa === "awaiting-retest" && sb === "awaiting-retest"
          ? minNum(ra.firstColdPassAt, rb.firstColdPassAt)
          : sa === "awaiting-retest"
            ? (ra.firstColdPassAt ?? null)
            : (rb.firstColdPassAt ?? null);
      const nextRetestAt =
        sa === "awaiting-retest" && sb === "awaiting-retest"
          ? minNum(ra.nextRetestAt, rb.nextRetestAt)
          : sa === "awaiting-retest"
            ? (ra.nextRetestAt ?? null)
            : (rb.nextRetestAt ?? null);
      extreme[k] = {
        attempts: Math.max(Number(ra.attempts ?? 0), Number(rb.attempts ?? 0)),
        stage: "awaiting-retest",
        firstColdPassAt,
        nextRetestAt,
        completedAt: null,
        rebootPassed: Boolean(ra.rebootPassed || rb.rebootPassed),
      };
    } else {
      extreme[k] = {
        attempts: Math.max(Number(ra.attempts ?? 0), Number(rb.attempts ?? 0)),
        stage: "not-done",
        firstColdPassAt: null,
        nextRetestAt: null,
        completedAt: null,
        rebootPassed: Boolean(ra.rebootPassed || rb.rebootPassed),
      };
    }
  }

  return { easy, medium, hard, extreme };
}

export async function ensureCoachTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS coach_accounts (
        google_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT 'user',
        family_name TEXT NOT NULL DEFAULT '',
        prompt_color TEXT NOT NULL DEFAULT '',
        command_color TEXT NOT NULL DEFAULT '',
        progress_json TEXT NOT NULL DEFAULT '{}',
        updated_at INTEGER NOT NULL DEFAULT 0
      )`,
    )
    .run();
}

export interface DbAccountRow {
  google_id: string;
  display_name: string;
  family_name: string;
  prompt_color: string;
  command_color: string;
  progress_json: string;
  updated_at: number;
}

export async function upsertCoachAccount(
  db: D1Database,
  input: {
    googleId: string;
    displayName?: string;
    familyName?: string;
    promptColor?: string;
    commandColor?: string;
    progress?: Record<string, unknown>;
  },
) {
  await ensureCoachTable(db);
  const existing = await db
    .prepare(
      "SELECT google_id, display_name, family_name, prompt_color, command_color, progress_json, updated_at FROM coach_accounts WHERE google_id = ?",
    )
    .bind(input.googleId)
    .first<DbAccountRow>();

  let existingProgress: Record<string, unknown> = {};
  if (existing?.progress_json) {
    try {
      existingProgress = JSON.parse(existing.progress_json) as Record<string, unknown>;
    } catch {
      existingProgress = {};
    }
  }

  const mergedProgress = mergeProgressSnapshots(existingProgress, input.progress ?? {});
  const displayName =
    input.displayName !== undefined
      ? sanitizePromptName(input.displayName, existing?.display_name || "user")
      : sanitizePromptName(existing?.display_name, "user");
  const familyName =
    input.familyName !== undefined
      ? sanitizePromptName(input.familyName, existing?.family_name || "")
      : sanitizePromptName(existing?.family_name, "");
  const promptColor =
    input.promptColor !== undefined ? sanitizeHexColor(input.promptColor) : sanitizeHexColor(existing?.prompt_color);
  const commandColor =
    input.commandColor !== undefined
      ? sanitizeHexColor(input.commandColor)
      : sanitizeHexColor(existing?.command_color);
  const updatedAt = Date.now();

  await db
    .prepare(
      `INSERT INTO coach_accounts (google_id, display_name, family_name, prompt_color, command_color, progress_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_id) DO UPDATE SET
         display_name = excluded.display_name,
         family_name = excluded.family_name,
         prompt_color = excluded.prompt_color,
         command_color = excluded.command_color,
         progress_json = excluded.progress_json,
         updated_at = excluded.updated_at`,
    )
    .bind(
      input.googleId,
      displayName,
      familyName,
      promptColor,
      commandColor,
      JSON.stringify(mergedProgress),
      updatedAt,
    )
    .run();

  return {
    googleId: input.googleId,
    displayName,
    familyName,
    promptColor,
    commandColor,
    progress: mergedProgress,
    updatedAt,
  };
}
