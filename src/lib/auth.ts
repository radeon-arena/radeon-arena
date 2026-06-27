import "server-only";
import { createHash, timingSafeEqual } from "crypto";

export interface AuthedUser {
  uid: string;
  email?: string;
  name?: string;
  isAdmin: boolean;
}

/**
 * Constant-time token comparison. Both sides are SHA-256'd to a fixed 32-byte
 * digest first, so neither the result nor the comparison time leaks the token
 * length or a matching prefix (a plain `===` short-circuits on the first
 * differing byte, which is a timing side-channel).
 */
function tokenMatches(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1] : null;
}

/**
 * Token-based authentication — no external identity provider (no Firebase).
 *
 *   ADMIN_TOKEN  — grants admin (verify submissions, moderate); required for /api/admin/*.
 *   SUBMIT_TOKEN — optional shared contributor token for submit / comment.
 *
 * Callers may pass a display name via the `X-Author` header so submissions and
 * comments are attributed to a readable name without a user database.
 */
export async function authenticate(req: Request): Promise<AuthedUser | null> {
  const token = bearer(req);
  if (!token) return null;

  const author = req.headers.get("x-author")?.slice(0, 80).trim() || undefined;

  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && tokenMatches(token, adminToken)) {
    return { uid: "admin", email: "admin@local", name: author ?? "Admin", isAdmin: true };
  }

  const submitToken = process.env.SUBMIT_TOKEN;
  if (submitToken && tokenMatches(token, submitToken)) {
    return { uid: "community", name: author ?? "Community contributor", isAdmin: false };
  }

  return null;
}

/** Require any authenticated user; returns null when unauthenticated. */
export async function requireUser(req: Request): Promise<AuthedUser | null> {
  return authenticate(req);
}

/** Require an admin user; returns null when not an admin. */
export async function requireAdmin(req: Request): Promise<AuthedUser | null> {
  const u = await authenticate(req);
  return u?.isAdmin ? u : null;
}
