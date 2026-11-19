const BUILD_ID = "__COACH_ECHO_BUILD_ID__";
const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, "");
const CACHE_PREFIX = BASE_PATH ? "coach-echo-2-subpath" : "coach-echo";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${BUILD_ID}`;
const AUDIO_CACHE = `${CACHE_PREFIX}-audio-v1`;
const SHELL_ROOT = `${BASE_PATH}/`;

const RAW_PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.png",
  "/icons/coach-echo-icon-64.png",
  "/icons/coach-echo-icon-192.png",
  "/icons/coach-echo-icon-512.png",
  "/icons/coach-echo-icon-maskable-512.png",
  "/audio/coach-echo-intro.mp3",
  /* __COACH_ECHO_BUILD_ASSETS__ */
];

const PRECACHE_URLS = RAW_PRECACHE_URLS.map((u) =>
  u === "/" ? SHELL_ROOT : `${BASE_PATH}${u}`,
);

async function cleanRedirectedResponse(response) {
  if (!response || !response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: "reload" }));
            if (response.ok) {
              await cache.put(url, await cleanRedirectedResponse(response));
            }
          } catch {
            // Best-effort per asset during install
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(`${CACHE_PREFIX}-shell-`) && key !== SHELL_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function respondWithRangeFromCache(request, cachedResponse) {
  const rangeHeader = request.headers.get("range");
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) {
    return cachedResponse;
  }
  const buffer = await cachedResponse.arrayBuffer();
  const total = buffer.byteLength;
  const parts = rangeHeader.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10) || 0;
  const end = parts[1] ? Math.min(total - 1, parseInt(parts[1], 10)) : total - 1;
  if (start >= total || start > end) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }
  const sliced = buffer.slice(start, end + 1);
  return new Response(sliced, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": cachedResponse.headers.get("Content-Type") || "audio/mpeg",
      "Content-Length": String(sliced.byteLength),
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    BASE_PATH &&
    url.pathname !== BASE_PATH &&
    !url.pathname.startsWith(`${BASE_PATH}/`)
  ) {
    return;
  }
  if (
    url.pathname === `${BASE_PATH}/sw.js` ||
    url.pathname === "/sw.js" ||
    url.pathname.startsWith(`${BASE_PATH}/api/`) ||
    url.pathname.startsWith("/api/") ||
    url.pathname === `${BASE_PATH}/privacy.html` ||
    url.pathname === "/privacy.html"
  ) {
    return;
  }

  // 1. Navigation requests: network-first so new deploys always update the app shell,
  //    falling back to cached SHELL_ROOT shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (
            networkResponse &&
            networkResponse.ok &&
            networkResponse.type !== "opaqueredirect"
          ) {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(SHELL_ROOT, await cleanRedirectedResponse(networkResponse.clone()));
          }
          return networkResponse;
        } catch {
          const shellCache = await caches.open(SHELL_CACHE);
          const cached =
            (await shellCache.match(SHELL_ROOT)) || (await caches.match(SHELL_ROOT));
          if (cached) return cleanRedirectedResponse(cached);
          throw new Error("Offline and app shell not yet cached");
        }
      })(),
    );
    return;
  }

  // 2. Audio files: serve from cache (supporting HTTP Range requests offline),
  //    and cache full 200 responses as clips are played.
  if (url.pathname.startsWith(`${BASE_PATH}/audio/`)) {
    event.respondWith(
      (async () => {
        const cached =
          (await caches.open(SHELL_CACHE).then((c) => c.match(url.pathname))) ||
          (await caches.open(AUDIO_CACHE).then((c) => c.match(url.pathname)));
        if (cached) {
          return respondWithRangeFromCache(request, cached);
        }
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const audioCache = await caches.open(AUDIO_CACHE);
          await audioCache.put(url.pathname, networkResponse.clone());
        }
        return networkResponse;
      })(),
    );
    return;
  }

  // 3. Immutable hashed Vite build bundles (/assets/*): cache-first.
  if (url.pathname.startsWith(`${BASE_PATH}/assets/`)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(url.pathname);
        if (cached) return cached;
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          await cache.put(url.pathname, networkResponse.clone());
        }
        return networkResponse;
      })(),
    );
    return;
  }

  // 4. Manifest, icons, and other static shell assets: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(url.pathname);
      const refreshPromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            await cache.put(url.pathname, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(refreshPromise);
        return cached;
      }
      const fresh = await refreshPromise;
      if (fresh) return fresh;
      throw new Error(`Offline and uncached: ${url.pathname}`);
    })(),
  );
});
