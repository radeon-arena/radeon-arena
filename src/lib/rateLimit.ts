import "server-only";

// Minimal in-process sliding-window rate limiter. The app runs as a single
// Next instance (docker compose), so an in-memory map is sufficient; swap for a
// shared store (Redis) only if the app is horizontally scaled.

const HITS = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number, windowMs: number): void {
  // Bound memory: at most once a minute, drop keys with no recent hits.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, ts] of HITS) {
    const live = ts.filter((t) => now - t < windowMs);
    if (live.length) HITS.set(k, live);
    else HITS.delete(k);
  }
}

/** True if the action is allowed (fewer than `limit` hits in the last `windowMs`). */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now, windowMs);
  const ts = (HITS.get(key) ?? []).filter((t) => now - t < windowMs);
  if (ts.length >= limit) {
    HITS.set(key, ts);
    return false;
  }
  ts.push(now);
  HITS.set(key, ts);
  return true;
}

/** Best-effort client IP from common proxy headers (used as the rate-limit key). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "unknown";
}
