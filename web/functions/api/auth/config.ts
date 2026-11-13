import { ALLOWED_AUTH_ORIGINS, corsHeaders, type PagesEnv } from "../_shared";

export const onRequestOptions = async ({ request }: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("Origin")),
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: PagesEnv }) => {
  const googleClientId = (env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || "").trim();
  return new Response(
    JSON.stringify({
      ok: true,
      googleClientId,
      allowedOrigins: ALLOWED_AUTH_ORIGINS,
      cloudSyncEnabled: Boolean(env.DB),
    }),
    {
      status: 200,
      headers: corsHeaders(request.headers.get("Origin")),
    },
  );
};
