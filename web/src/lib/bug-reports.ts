import { loadAuthAccount, sanitizePromptName } from "@/lib/auth-sync";
import { withBasePath } from "@/lib/base-path";
import { loadState, saveState } from "@/lib/storage";

export const BUG_REPORT_TYPES = [
  "Something's broken",
  "The explanation confused me",
  "I have a better explanation",
] as const;

export type BugReportType = (typeof BUG_REPORT_TYPES)[number];

export const DEFAULT_BUG_REPORT_TYPE: BugReportType = "Something's broken";
export const MAX_SCREENSHOT_WIDTH = 1200;
export const MAX_SCREENSHOT_BYTES = 1_000_000;
export const LOCAL_BUG_REPORTS_STORAGE_KEY = "coachBugReportsMirror";

const STAMPED_BUILD_ID = "__COACH_ECHO_APP_BUILD_ID__";
let cachedRuntimeBuildId: string | null = null;
let localReportSeq = 1;

export interface BugReportItem {
  id: number;
  reportType: BugReportType;
  description: string;
  pageRoute: string;
  commandName: string;
  buildId: string;
  userAgent: string;
  reporterId: string;
  reporterName: string;
  photoBase64: string;
  createdAt: number;
}

export interface SubmitBugReportInput {
  reportType?: BugReportType;
  description: string;
  pageRoute?: string;
  commandName?: string;
  photoBase64?: string;
}

export function normalizeBugReportType(raw: unknown): BugReportType {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if ((BUG_REPORT_TYPES as readonly string[]).includes(trimmed)) {
      return trimmed as BugReportType;
    }
  }
  return DEFAULT_BUG_REPORT_TYPE;
}

export async function resolveAppBuildId(): Promise<string> {
  if (
    STAMPED_BUILD_ID &&
    !STAMPED_BUILD_ID.includes("COACH_ECHO_APP_BUILD_ID")
  ) {
    return STAMPED_BUILD_ID;
  }
  if (cachedRuntimeBuildId) {
    return cachedRuntimeBuildId;
  }
  if (typeof window !== "undefined" && typeof fetch !== "undefined") {
    try {
      const res = await fetch(withBasePath("/sw.js"), { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        const m = text.match(/BUILD_ID\s*=\s*"([^"]+)"/);
        if (m && m[1] && !m[1].includes("COACH_ECHO_BUILD_ID")) {
          cachedRuntimeBuildId = m[1];
          return m[1];
        }
      }
    } catch {
      // ignore offline or test environment
    }
  }
  return "dev";
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(",");
  const payload = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.ceil((payload.length * 3) / 4);
}

export type ScreenshotCompressResult =
  | {
      ok: true;
      dataUrl: string;
      byteLength: number;
      width: number;
      height: number;
    }
  | {
      ok: false;
      reason: "not-image" | "too-large" | "read-error";
      message: string;
    };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Empty file result"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export async function compressScreenshotFile(
  file: File,
  maxWidth = MAX_SCREENSHOT_WIDTH,
  maxBytes = MAX_SCREENSHOT_BYTES,
): Promise<ScreenshotCompressResult> {
  if (!file.type || !file.type.startsWith("image/")) {
    return {
      ok: false,
      reason: "not-image",
      message: "Please choose an image file (PNG, JPEG, or WebP).",
    };
  }

  let rawDataUrl: string;
  try {
    rawDataUrl = await readFileAsDataUrl(file);
  } catch {
    return {
      ok: false,
      reason: "read-error",
      message: "Could not read that image. You can send your report without a screenshot.",
    };
  }

  if (typeof document === "undefined" || typeof Image === "undefined") {
    const bytes = file.size || estimateDataUrlBytes(rawDataUrl);
    if (bytes > maxBytes) {
      return {
        ok: false,
        reason: "too-large",
        message:
          "That screenshot is still over 1 MB after compression. You can send your report without it.",
      };
    }
    return { ok: true, dataUrl: rawDataUrl, byteLength: bytes, width: maxWidth, height: maxWidth };
  }

  return new Promise<ScreenshotCompressResult>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const srcW = img.naturalWidth || img.width || 800;
        const srcH = img.naturalHeight || img.height || 600;
        const scale = srcW > maxWidth ? maxWidth / srcW : 1;
        const targetW = Math.max(1, Math.round(srcW * scale));
        const targetH = Math.max(1, Math.round(srcH * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const fallbackBytes = estimateDataUrlBytes(rawDataUrl);
          if (fallbackBytes > maxBytes) {
            resolve({
              ok: false,
              reason: "too-large",
              message:
                "That screenshot is still over 1 MB after compression. You can send your report without it.",
            });
            return;
          }
          resolve({
            ok: true,
            dataUrl: rawDataUrl,
            byteLength: fallbackBytes,
            width: targetW,
            height: targetH,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        let compressed = canvas.toDataURL("image/jpeg", 0.82);
        let bytes = estimateDataUrlBytes(compressed);

        if (bytes > maxBytes) {
          compressed = canvas.toDataURL("image/jpeg", 0.55);
          bytes = estimateDataUrlBytes(compressed);
        }

        if (bytes > maxBytes) {
          resolve({
            ok: false,
            reason: "too-large",
            message:
              "That screenshot is still over 1 MB after compression. You can send your report without it.",
          });
          return;
        }

        resolve({
          ok: true,
          dataUrl: compressed,
          byteLength: bytes,
          width: targetW,
          height: targetH,
        });
      } catch {
        const fallbackBytes = file.size || estimateDataUrlBytes(rawDataUrl);
        if (fallbackBytes > maxBytes) {
          resolve({
            ok: false,
            reason: "too-large",
            message:
              "That screenshot is still over 1 MB after compression. You can send your report without it.",
          });
          return;
        }
        resolve({
          ok: true,
          dataUrl: rawDataUrl,
          byteLength: fallbackBytes,
          width: maxWidth,
          height: maxWidth,
        });
      }
    };

    img.onerror = () => {
      // Handle synthetic test File payloads that are not real encoded bitmaps
      const fallbackBytes = file.size || estimateDataUrlBytes(rawDataUrl);
      if (fallbackBytes > maxBytes) {
        resolve({
          ok: false,
          reason: "too-large",
          message:
            "That screenshot is still over 1 MB after compression. You can send your report without it.",
        });
        return;
      }
      resolve({
        ok: true,
        dataUrl: rawDataUrl,
        byteLength: fallbackBytes,
        width: maxWidth,
        height: maxWidth,
      });
    };

    img.src = rawDataUrl;
  });
}

export function loadLocalBugReports(): BugReportItem[] {
  const raw = loadState<BugReportItem[]>(LOCAL_BUG_REPORTS_STORAGE_KEY, []);
  if (!Array.isArray(raw)) return [];
  return [...raw]
    .map((item) => ({
      ...item,
      reportType: normalizeBugReportType(item.reportType),
    }))
    .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
}

function saveLocalBugReports(items: BugReportItem[]): void {
  const sorted = [...items]
    .map((item) => ({
      ...item,
      reportType: normalizeBugReportType(item.reportType),
    }))
    .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
    .slice(0, 100);
  saveState(LOCAL_BUG_REPORTS_STORAGE_KEY, sorted);
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("coach:bug-reports-updated"));
  }
}

export async function submitBugReport(input: SubmitBugReportInput): Promise<{
  ok: boolean;
  report: BugReportItem;
}> {
  const description = input.description.trim();
  if (!description) {
    throw new Error("What went wrong? is required");
  }

  const reportType = normalizeBugReportType(input.reportType);
  const account = loadAuthAccount();
  const reporterId = account?.googleId || "guest";
  const reporterName = account?.displayName ? sanitizePromptName(account.displayName, "guest") : "guest";
  const pageRoute =
    input.pageRoute?.trim() ||
    (typeof window !== "undefined" && window.location
      ? `${window.location.pathname || "/"}${window.location.search || ""}`
      : "/");
  const commandName = (input.commandName || "").trim();
  const buildId = await resolveAppBuildId();
  const userAgent =
    typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : "unknown";
  const photoBase64 = input.photoBase64 || "";
  const createdAt = Date.now();
  const fallbackId = createdAt * 100 + (localReportSeq++ % 100);

  let savedReport: BugReportItem = {
    id: fallbackId,
    reportType,
    description,
    pageRoute,
    commandName,
    buildId,
    userAgent,
    reporterId,
    reporterName,
    photoBase64,
    createdAt,
  };

  try {
    const response = await fetch(withBasePath("/api/bug-reports"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportType,
        description,
        pageRoute,
        commandName,
        buildId,
        userAgent,
        reporterId,
        reporterName,
        photoBase64,
        createdAt,
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as { ok?: boolean; report?: BugReportItem };
      if (data?.report) {
        savedReport = {
          ...data.report,
          reportType: normalizeBugReportType(data.report.reportType),
        };
      }
    }
  } catch {
    // Offline or test environment without worker
  }

  const existing = loadLocalBugReports().filter((r) => r.id !== savedReport.id);
  saveLocalBugReports([savedReport, ...existing]);

  return { ok: true, report: savedReport };
}

export async function fetchBugReports(): Promise<BugReportItem[]> {
  const local = loadLocalBugReports();
  try {
    const response = await fetch(withBasePath("/api/bug-reports"), {
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as { ok?: boolean; reports?: BugReportItem[] };
        if (Array.isArray(data?.reports)) {
          const normalizedRemote = data.reports.map((r) => ({
            ...r,
            reportType: normalizeBugReportType(r.reportType),
          }));
          // If remote API is active, use remote list merged with any local-only items from this session
          const byId = new Map<number, BugReportItem>();
          for (const item of normalizedRemote) byId.set(item.id, item);
          for (const item of local) {
            if (!byId.has(item.id)) byId.set(item.id, item);
          }
          const merged = Array.from(byId.values()).sort(
            (a, b) => b.createdAt - a.createdAt || b.id - a.id,
          );
          saveState(LOCAL_BUG_REPORTS_STORAGE_KEY, merged.slice(0, 100));
          return merged;
        }
      }
    }
  } catch {
    // Offline or local test environment
  }
  return local;
}

export async function deleteBugReport(id: number): Promise<void> {
  try {
    await fetch(withBasePath(`/api/bug-reports?id=${encodeURIComponent(String(id))}`), {
      method: "DELETE",
    });
  } catch {
    // ignore offline error
  }
  const remaining = loadLocalBugReports().filter((r) => r.id !== id);
  saveLocalBugReports(remaining);
}
