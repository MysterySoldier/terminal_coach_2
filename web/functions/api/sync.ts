import {
  corsHeaders,
  ensureCoachTable,
  sanitizeHexColor,
  sanitizePromptName,
  upsertCoachAccount,
  type DbAccountRow,
  type PagesEnv,
} from "./_shared";

export const onRequestOptions = async ({ request }: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  const url = new URL(request.url);
  const googleId = (url.searchParams.get("googleId") || "").trim();
  if (!googleId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing googleId" }), {
      status: 400,
      headers,
    });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ ok: false, error: "D1 database not bound" }), {
      status: 503,
      headers,
    });
  }

  await ensureCoachTable(env.DB);
  const row = await env.DB.prepare(
    "SELECT google_id, display_name, family_name, prompt_color, command_color, progress_json, updated_at FROM coach_accounts WHERE google_id = ?",
  )
    .bind(googleId)
    .first<DbAccountRow>();

  if (!row) {
    return new Response(
      JSON.stringify({
        ok: true,
        account: {
          googleId,
          displayName: "user",
          familyName: "",
          promptColor: "",
          commandColor: "",
          progress: { easy: {}, medium: {}, hard: {}, extreme: {} },
          updatedAt: 0,
        },
      }),
      { status: 200, headers },
    );
  }

  let progress = { easy: {}, medium: {}, hard: {}, extreme: {} };
  try {
    progress = JSON.parse(row.progress_json);
  } catch {
    // ignore malformed json
  }

  return new Response(
    JSON.stringify({
      ok: true,
      account: {
        googleId: row.google_id,
        displayName: sanitizePromptName(row.display_name, "user"),
        familyName: sanitizePromptName(row.family_name, ""),
        promptColor: sanitizeHexColor(row.prompt_color),
        commandColor: sanitizeHexColor(row.command_color),
        progress,
        updatedAt: row.updated_at,
      },
    }),
    { status: 200, headers },
  );
};

export const onRequestPost = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  let body: {
    googleId?: string;
    displayName?: string;
    familyName?: string;
    promptColor?: string;
    commandColor?: string;
    progress?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers,
    });
  }

  const googleId = (body.googleId || "").trim().slice(0, 128);
  if (!googleId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing googleId" }), {
      status: 400,
      headers,
    });
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        ok: true,
        account: {
          googleId,
          displayName: sanitizePromptName(body.displayName, "user"),
          familyName: sanitizePromptName(body.familyName, ""),
          promptColor: sanitizeHexColor(body.promptColor),
          commandColor: sanitizeHexColor(body.commandColor),
          progress: body.progress ?? { easy: {}, medium: {}, hard: {}, extreme: {} },
          updatedAt: Date.now(),
        },
      }),
      { status: 200, headers },
    );
  }

  const account = await upsertCoachAccount(env.DB, {
    googleId,
    displayName: body.displayName,
    familyName: body.familyName,
    promptColor: body.promptColor,
    commandColor: body.commandColor,
    progress: body.progress,
  });

  return new Response(JSON.stringify({ ok: true, account }), {
    status: 200,
    headers,
  });
};
