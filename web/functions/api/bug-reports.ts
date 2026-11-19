import {
  corsHeaders,
  sanitizePromptName,
  type D1Database,
  type PagesEnv,
} from "./_shared";

export const VALID_REPORT_TYPES = [
  "Something's broken",
  "The explanation confused me",
  "I have a better explanation",
] as const;

export type BugReportType = (typeof VALID_REPORT_TYPES)[number];

export function normalizeReportType(raw: unknown): BugReportType {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if ((VALID_REPORT_TYPES as readonly string[]).includes(trimmed)) {
      return trimmed as BugReportType;
    }
  }
  return "Something's broken";
}

export interface DbBugReportRow {
  id: number;
  report_type: string;
  description: string;
  page_route: string;
  command_name: string;
  build_id: string;
  user_agent: string;
  reporter_id: string;
  reporter_name: string;
  photo_base64: string;
  created_at: number;
}

export interface BugReportPayload {
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

export async function ensureBugReportsTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS bug_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_type TEXT NOT NULL DEFAULT 'Something''s broken',
        description TEXT NOT NULL,
        page_route TEXT NOT NULL DEFAULT '',
        command_name TEXT NOT NULL DEFAULT '',
        build_id TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT '',
        reporter_id TEXT NOT NULL DEFAULT 'guest',
        reporter_name TEXT NOT NULL DEFAULT 'guest',
        photo_base64 TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL DEFAULT 0
      )`,
    )
    .run();
}

function decodeBase64DataUrl(dataUrl: string): { bytes: Uint8Array; mimeType: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  const base64 = match ? match[2] : dataUrl;
  const mimeType = match ? match[1] : "image/jpeg";
  try {
    const binary = atob(base64.replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, mimeType };
  } catch {
    return null;
  }
}

export async function postBugReportToDiscord(
  webhookUrl: string | undefined,
  report: BugReportPayload,
): Promise<boolean> {
  const trimmedUrl = (webhookUrl || "").trim();
  if (!trimmedUrl) return false;

  try {
    const dateIso = new Date(report.createdAt).toISOString();
    const pageOrCommand = report.commandName
      ? `${report.pageRoute} · command: ${report.commandName}`
      : report.pageRoute || "/";

    const lines = [
      `**Over Your Shoulder — ${report.reportType}**`,
      `**What went wrong:** ${report.description}`,
      `**Page / Command:** \`${pageOrCommand}\``,
      `**BUILD_ID:** \`${report.buildId || "unknown"}\``,
      `**Date:** ${dateIso}`,
      `**Reporter:** \`${report.reporterName || "guest"}\``,
    ];
    const content = lines.join("\n").slice(0, 1950);

    if (report.photoBase64) {
      const decoded = decodeBase64DataUrl(report.photoBase64);
      if (decoded && typeof FormData !== "undefined" && typeof Blob !== "undefined") {
        const formData = new FormData();
        formData.append(
          "payload_json",
          JSON.stringify({
            content,
            attachments: [{ id: 0, filename: "screenshot.jpg" }],
          }),
        );
        const blob = new Blob([decoded.bytes], { type: decoded.mimeType });
        formData.append("files[0]", blob, "screenshot.jpg");
        const res = await fetch(trimmedUrl, {
          method: "POST",
          body: formData,
        });
        return res.ok;
      }
    }

    const res = await fetch(trimmedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function rowToPayload(row: DbBugReportRow): BugReportPayload {
  return {
    id: Number(row.id),
    reportType: normalizeReportType(row.report_type),
    description: String(row.description ?? ""),
    pageRoute: String(row.page_route ?? ""),
    commandName: String(row.command_name ?? ""),
    buildId: String(row.build_id ?? ""),
    userAgent: String(row.user_agent ?? ""),
    reporterId: String(row.reporter_id ?? "guest"),
    reporterName: String(row.reporter_name ?? "guest"),
    photoBase64: String(row.photo_base64 ?? ""),
    createdAt: Number(row.created_at ?? 0),
  };
}

export const onRequestOptions = async ({ request }: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  if (!env.DB) {
    return new Response(JSON.stringify({ ok: true, reports: [] }), {
      status: 200,
      headers,
    });
  }

  await ensureBugReportsTable(env.DB);
  const queryResult = await env.DB.prepare(
    `SELECT id, report_type, description, page_route, command_name, build_id, user_agent, reporter_id, reporter_name, photo_base64, created_at
     FROM bug_reports
     ORDER BY created_at DESC, id DESC
     LIMIT 100`,
  ).all<DbBugReportRow>();

  const rows = Array.isArray(queryResult?.results) ? queryResult.results : [];
  const reports = rows.map(rowToPayload);

  return new Response(JSON.stringify({ ok: true, reports }), {
    status: 200,
    headers,
  });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  let body: {
    reportType?: string;
    description?: string;
    pageRoute?: string;
    commandName?: string;
    buildId?: string;
    userAgent?: string;
    reporterId?: string;
    reporterName?: string;
    photoBase64?: string;
    createdAt?: number;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers,
    });
  }

  const description = typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "";
  if (!description) {
    return new Response(JSON.stringify({ ok: false, error: "What went wrong? is required" }), {
      status: 400,
      headers,
    });
  }

  const reportType = normalizeReportType(body.reportType);
  const pageRoute = typeof body.pageRoute === "string" ? body.pageRoute.trim().slice(0, 256) : "/";
  const commandName = typeof body.commandName === "string" ? body.commandName.trim().slice(0, 128) : "";
  const buildId = typeof body.buildId === "string" ? body.buildId.trim().slice(0, 64) : "";
  const userAgent =
    typeof body.userAgent === "string" && body.userAgent.trim()
      ? body.userAgent.trim().slice(0, 512)
      : (request.headers.get("User-Agent") || "").slice(0, 512);
  const reporterId =
    typeof body.reporterId === "string" && body.reporterId.trim()
      ? body.reporterId.trim().slice(0, 128)
      : "guest";
  const reporterName =
    typeof body.reporterName === "string" && body.reporterName.trim()
      ? sanitizePromptName(body.reporterName, "guest")
      : "guest";
  const photoBase64 =
    typeof body.photoBase64 === "string" && body.photoBase64.startsWith("data:image/")
      ? body.photoBase64
      : "";
  const createdAt =
    typeof body.createdAt === "number" && Number.isFinite(body.createdAt) && body.createdAt > 0
      ? Math.floor(body.createdAt)
      : Date.now();

  let insertedId = Date.now();

  if (env.DB) {
    await ensureBugReportsTable(env.DB);
    const runRes = await env.DB.prepare(
      `INSERT INTO bug_reports (
        report_type, description, page_route, command_name, build_id, user_agent, reporter_id, reporter_name, photo_base64, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
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
      )
      .run();
    if (runRes?.meta?.last_row_id) {
      insertedId = Number(runRes.meta.last_row_id);
    }
  }

  const savedReport: BugReportPayload = {
    id: insertedId,
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

  await postBugReportToDiscord(env.BUG_DISCORD_WEBHOOK, savedReport);

  return new Response(JSON.stringify({ ok: true, report: savedReport }), {
    status: 200,
    headers,
  });
};

export const onRequestDelete = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  const url = new URL(request.url);
  let targetId = Number(url.searchParams.get("id") || 0);

  if (!targetId) {
    try {
      const body = (await request.json()) as { id?: number };
      if (body?.id) targetId = Number(body.id);
    } catch {
      // ignore
    }
  }

  if (!targetId || !Number.isFinite(targetId)) {
    return new Response(JSON.stringify({ ok: false, error: "Missing report id" }), {
      status: 400,
      headers,
    });
  }

  if (env.DB) {
    await ensureBugReportsTable(env.DB);
    await env.DB.prepare("DELETE FROM bug_reports WHERE id = ?").bind(targetId).run();
  }

  return new Response(JSON.stringify({ ok: true, deletedId: targetId }), {
    status: 200,
    headers,
  });
};
