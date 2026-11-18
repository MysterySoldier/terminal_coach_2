export const SUBPATH_PREFIX = "/coach_echo";

/**
 * Detect whether the app is running under the `/coach_echo` subpath
 * (e.g. `https://mysterylabs.dev/coach_echo`) vs root `/`
 * (e.g. `https://mysterylabs-coach-2.pages.dev`).
 */
export function getBasePath(): string {
  if (typeof window !== "undefined" && window.location && typeof window.location.pathname === "string") {
    const pathname = window.location.pathname;
    if (pathname === SUBPATH_PREFIX || pathname.startsWith(`${SUBPATH_PREFIX}/`)) {
      return SUBPATH_PREFIX;
    }
  }
  return "";
}

/**
 * Prefix a root-relative asset or API path (e.g. `/images/commands/docker.jpg`,
 * `/audio/xyz.mp3`, `/api/auth/config`) with `/coach_echo` when running under
 * the `/coach_echo` subpath, or leave it unchanged at root `/`.
 */
export function withBasePath(path: string): string {
  if (!path || !path.startsWith("/")) return path;
  const base = getBasePath();
  if (!base) return path;
  if (path === "/") return `${base}/`;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}
