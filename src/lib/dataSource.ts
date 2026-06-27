import "server-only";

import type { Benchmark, LeaderboardSnapshot } from "./types";
import { pgEnabled } from "./db";
import { getAllBenchmarksPg, getBenchmarkPg } from "./pgSource";
import { loadBenchmarks } from "./benchmarkData";
import { buildSnapshot, buildCarousel, snapshotIntervalHours } from "./aggregate";

export { buildSnapshot, buildCarousel };

/**
 * Fetch every benchmark submission. Source precedence:
 *   1. Postgres        (DATABASE_URL configured) — the radeon-arena database
 *   2. Bundled dataset (offline fallback so the site always renders)
 */
export async function getAllBenchmarks(): Promise<Benchmark[]> {
  if (pgEnabled()) return getAllBenchmarksPg();
  return loadBenchmarks();
}

/** Fetch one benchmark by id, from Postgres, then the bundled dataset. */
export async function getBenchmark(id: string): Promise<Benchmark | null> {
  if (pgEnabled()) return getBenchmarkPg(id);
  return loadBenchmarks().find((b) => b.benchmarkId === id || b.id === id) ?? null;
}

// ── In-memory snapshot cache honoring the configured refresh interval. ───────
let snapCache: { at: number; data: LeaderboardSnapshot } | null = null;

export async function getSnapshot(): Promise<LeaderboardSnapshot> {
  const ttlMs = snapshotIntervalHours() * 3600_000;
  if (snapCache && Date.now() - snapCache.at < ttlMs) return snapCache.data;
  const data = buildSnapshot(await getAllBenchmarks());
  snapCache = { at: Date.now(), data };
  return data;
}

/** Drop the cached snapshot so the next read rebuilds it. Call after any write
 * (submit / verify) so new or re-graded results appear without waiting out the
 * refresh interval. */
export function invalidateSnapshot(): void {
  snapCache = null;
}
