import {
  corsHeaders,
  sanitizePromptName,
  upsertCoachAccount,
  type PagesEnv,
} from "../_shared";

interface GoogleAuthRequestBody {
  credential?: string;
  accessToken?: string;
  googleId?: string;
  displayName?: string;
  familyName?: string;
  promptColor?: string;
  commandColor?: string;
  progress?: Record<string, unknown>;
}

export const onRequestOptions = async ({ request }: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const headers = corsHeaders(request.headers.get("Origin"));
  let body: GoogleAuthRequestBody;
  try {
    body = (await request.json()) as GoogleAuthRequestBody;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
      status: 400,
      headers,
    });
  }

  let googleId = "";
  let displayName: string | undefined = body.displayName;
  let familyName: string | undefined = body.familyName;

  // 1. Verify Google Identity Services ID token if provided
  if (typeof body.credential === "string" && body.credential.trim()) {
    try {
      const tokenRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential.trim())}`,
      );
      if (!tokenRes.ok) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid Google ID token" }), {
          status: 401,
          headers,
        });
      }
      const tokenInfo = (await tokenRes.json()) as {
        sub?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
        aud?: string;
      };
      const configuredClientId = (env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || "").trim();
      if (configuredClientId && tokenInfo.aud && tokenInfo.aud !== configuredClientId) {
        return new Response(JSON.stringify({ ok: false, error: "Google token audience mismatch" }), {
          status: 401,
          headers,
        });
      }
      googleId = (tokenInfo.sub || "").trim();
      displayName = displayName || tokenInfo.family_name || tokenInfo.given_name || tokenInfo.name || "user";
      familyName = familyName || tokenInfo.family_name || "";
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Could not verify Google ID token" }), {
        status: 502,
        headers,
      });
    }
  } else if (typeof body.accessToken === "string" && body.accessToken.trim()) {
    // 2. Verify Google OAuth 2.0 access token via userinfo endpoint
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${body.accessToken.trim()}` },
      });
      if (!userRes.ok) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid Google access token" }), {
          status: 401,
          headers,
        });
      }
      const userInfo = (await userRes.json()) as {
        sub?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
      };
      googleId = (userInfo.sub || "").trim();
      displayName = displayName || userInfo.family_name || userInfo.given_name || userInfo.name || "user";
      familyName = familyName || userInfo.family_name || "";
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Could not verify Google access token" }), {
        status: 502,
        headers,
      });
    }
  } else if (typeof body.googleId === "string" && body.googleId.trim()) {
    // 3. Direct Google account profile sign-in
    googleId = body.googleId.trim().slice(0, 128);
  }

  if (!googleId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing googleId or Google token" }), {
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
          displayName: sanitizePromptName(displayName, "user"),
          familyName: sanitizePromptName(familyName, ""),
          promptColor: body.promptColor ?? "",
          commandColor: body.commandColor ?? "",
          progress: body.progress ?? { easy: {}, medium: {}, hard: {}, extreme: {} },
          updatedAt: Date.now(),
        },
      }),
      { status: 200, headers },
    );
  }

  const account = await upsertCoachAccount(env.DB, {
    googleId,
    displayName,
    familyName,
    promptColor: body.promptColor,
    commandColor: body.commandColor,
    progress: body.progress,
  });

  return new Response(JSON.stringify({ ok: true, account }), {
    status: 200,
    headers,
  });
};
