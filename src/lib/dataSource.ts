import "server-only";

import type { Benchmark, LeaderboardSnapshot } from "./types";
import { getAdminDb } from "./firebaseAdmin";
import { pgEnabled } from "./db";
import { getAllBenchmarksPg, getBenchmarkPg } from "./pgSource";
import { loadInferStationBenchmarks } from "./inferstationData";
import { buildSnapshot, buildCarousel, snapshotIntervalHours } from "./aggregate";

export { buildSnapshot, buildCarousel };

/**
 * Fetch every benchmark submission. Source precedence:
 *   1. Postgres        (DATABASE_URL configured) — the radeon-arena database
 *   2. Firestore       (Firebase configured)
 *   3. Bundled dataset (offline fallback so the site always renders)
 */
export async function getAllBenchmarks(): Promise<Benchmark[]> {
  if (pgEnabled()) return getAllBenchmarksPg();
  const db = getAdminDb();
  if (db) {
    const snap = await db.collection("benchmarks").get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Benchmark, "id">) }));
  }
  return loadInferStationBenchmarks();
}

/** Fetch one benchmark by id, from Postgres, then Firestore, then the dataset. */
export async function getBenchmark(id: string): Promise<Benchmark | null> {
  if (pgEnabled()) return getBenchmarkPg(id);
  const db = getAdminDb();
  if (db) {
    const doc = await db.collection("benchmarks").doc(id).get();
    return doc.exists ? { id: doc.id, ...(doc.data() as Omit<Benchmark, "id">) } : null;
  }
  return loadInferStationBenchmarks().find((b) => b.benchmarkId === id || b.id === id) ?? null;
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
