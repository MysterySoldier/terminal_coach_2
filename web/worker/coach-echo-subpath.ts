const UPSTREAM_ORIGIN = "https://mysterylabs-coach-2.pages.dev";
const SUBPATH_PREFIX = "/coach_echo";

const STATIC_PREFIXES = ["/assets/", "/images/", "/audio/", "/icons/"];
const STATIC_EXACT = new Set(["/favicon.png", "/icon.png", "/robots.txt"]);

function isStaticAssetPath(subpath: string): boolean {
  if (STATIC_EXACT.has(subpath)) return true;
  return STATIC_PREFIXES.some((prefix) => subpath.startsWith(prefix));
}

function rewriteIndexHtmlForSubpath(html: string): string {
  return html
    .replace(/href="\/manifest\.webmanifest"/g, `href="${SUBPATH_PREFIX}/manifest.webmanifest"`)
    .replace(/href="\/favicon\.png"/g, `href="${SUBPATH_PREFIX}/favicon.png"`)
    .replace(/href="\/icons\//g, `href="${SUBPATH_PREFIX}/icons/`)
    .replace(/src="\/assets\//g, `src="${SUBPATH_PREFIX}/assets/`)
    .replace(/href="\/assets\//g, `href="${SUBPATH_PREFIX}/assets/`);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== SUBPATH_PREFIX && !url.pathname.startsWith(`${SUBPATH_PREFIX}/`)) {
      return fetch(request);
    }

    const subpath = url.pathname.slice(SUBPATH_PREFIX.length) || "/";

    // 1. API routes (/coach_echo/api/* -> Pages Functions /api/* on mysterylabs-coach-2)
    if (subpath === "/api" || subpath.startsWith("/api/")) {
      const apiUrl = `${UPSTREAM_ORIGIN}${subpath}${url.search}`;
      const headers = new Headers(request.headers);
      if (!headers.has("Origin")) {
        headers.set("Origin", url.origin);
      }
      const init: RequestInit = {
        method: request.method,
        headers,
        redirect: "manual",
      };
      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
      }
      return fetch(apiUrl, init);
    }

    // 2. Web App Manifest (/coach_echo/manifest.webmanifest)
    if (subpath === "/manifest.webmanifest") {
      const upstreamRes = await fetch(`${UPSTREAM_ORIGIN}/manifest.webmanifest`, {
        cf: { cacheTtl: 0 },
      } as RequestInit);
      if (!upstreamRes.ok) return upstreamRes;
      try {
        const manifest = (await upstreamRes.json()) as {
          id?: string;
          start_url?: string;
          scope?: string;
          icons?: Array<{ src: string; sizes?: string; type?: string; purpose?: string }>;
          [key: string]: unknown;
        };
        manifest.id = `${SUBPATH_PREFIX}/`;
        manifest.start_url = `${SUBPATH_PREFIX}/`;
        manifest.scope = `${SUBPATH_PREFIX}/`;
        if (Array.isArray(manifest.icons)) {
          manifest.icons = manifest.icons.map((icon) => ({
            ...icon,
            src: icon.src.startsWith("/") ? `${SUBPATH_PREFIX}${icon.src}` : icon.src,
          }));
        }
        return new Response(JSON.stringify(manifest, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/manifest+json; charset=utf-8",
            "Cache-Control": "public, max-age=0, must-revalidate",
          },
        });
      } catch {
        return upstreamRes;
      }
    }

    // 3. Service Worker (/coach_echo/sw.js)
    if (subpath === "/sw.js") {
      const swRes = await fetch(`${UPSTREAM_ORIGIN}/sw.js`, {
        headers: { "Cache-Control": "no-cache" },
        cf: { cacheTtl: 0 },
      } as RequestInit);
      const body = await swRes.text();
      return new Response(body, {
        status: swRes.status,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Service-Worker-Allowed": `${SUBPATH_PREFIX}/`,
        },
      });
    }

    // 3.5. Standalone static HTML pages (/coach_echo/privacy.html -> /privacy.html)
    if (subpath === "/privacy.html" || subpath === "/privacy" || subpath === "/privacy/") {
      const pageRes = await fetch(`${UPSTREAM_ORIGIN}/privacy.html`, {
        headers: { "Cache-Control": "no-cache" },
        cf: { cacheTtl: 0 },
      } as RequestInit);
      return new Response(pageRes.body, {
        status: pageRes.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }

    // 4. Static assets (/assets/*, /images/*, /audio/*, /icons/*, /favicon.png, etc.)
    if (isStaticAssetPath(subpath)) {
      const upstreamHeaders = new Headers();
      const range = request.headers.get("Range");
      if (range) upstreamHeaders.set("Range", range);
      const ifNoneMatch = request.headers.get("If-None-Match");
      if (ifNoneMatch) upstreamHeaders.set("If-None-Match", ifNoneMatch);

      const assetRes = await fetch(`${UPSTREAM_ORIGIN}${subpath}${url.search}`, {
        method: request.method,
        headers: upstreamHeaders,
      });

      const contentType = assetRes.headers.get("Content-Type") || "";
      if (contentType.includes("text/html")) {
        return new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      const respHeaders = new Headers(assetRes.headers);
      return new Response(assetRes.body, {
        status: assetRes.status,
        statusText: assetRes.statusText,
        headers: respHeaders,
      });
    }

    // 5. SPA HTML shell for /coach_echo, /coach_echo/, and any client route (/coach_echo/coach, etc.)
    const indexRes = await fetch(`${UPSTREAM_ORIGIN}/index.html`, {
      headers: { "Cache-Control": "no-cache" },
      cf: { cacheTtl: 0 },
    } as RequestInit);
    const rawHtml = await indexRes.text();
    const rewrittenHtml = rewriteIndexHtmlForSubpath(rawHtml);

    return new Response(rewrittenHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  },
};
