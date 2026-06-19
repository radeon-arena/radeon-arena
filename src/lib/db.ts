import "server-only";

import { Pool, type PoolClient } from "pg";

/**
 * Lazily-initialised Postgres connection pool for radeon-arena.
 *
 * Returns null when DATABASE_URL is not configured, so callers transparently
 * fall back to the bundled dataset and the site still renders without a live
 * database. This mirrors the firebaseAdmin pattern.
 */
let pool: Pool | null | undefined; // undefined = not yet initialised, null = disabled

export function getPool(): Pool | null {
  if (pool !== undefined) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    pool = null;
    return pool;
  }
  pool = new Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (err) => {
    // Don't crash the server on a transient idle-client error.
    console.error("[pg] idle client error:", err.message);
  });
  return pool;
}

/** True when a Postgres backend is configured. */
export function pgEnabled(): boolean {
  return getPool() !== null;
}

/** Run a query with automatic client acquire/release. */
export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const p = getPool();
  if (!p) throw new Error("Postgres is not configured (DATABASE_URL unset)");
  const client: PoolClient = await p.connect();
  try {
    const res = await client.query(text, params as never[]);
    return res.rows as T[];
  } finally {
    client.release();
  }
}
