import "server-only";

import type { Benchmark, VerificationStatus, VerificationRecord } from "./types";
import { query } from "./db";

// Each row stores the full Benchmark object in `doc`, plus promoted verification
// columns. We rehydrate the doc and merge the columns on top so legacy rows
// (whose doc predates verification) default sensibly.
interface Row {
  doc: Benchmark;
  verification_status: VerificationStatus;
  self_reported: boolean;
}

// Merge promoted verification columns onto the stored doc (doc wins if present,
// otherwise fall back to the column — so legacy rows default to "self").
function hydrate(r: Row): Benchmark {
  return {
    ...r.doc,
    verificationStatus: r.doc.verificationStatus ?? r.verification_status ?? "self",
    selfReported: r.doc.selfReported ?? r.self_reported ?? false,
  };
}

/** Fetch every benchmark submission from Postgres. */
export async function getAllBenchmarksPg(): Promise<Benchmark[]> {
  const rows = await query<Row>(
    "SELECT doc, verification_status, self_reported FROM benchmarks",
  );
  return rows.map(hydrate);
}

/** Fetch one benchmark by id (benchmark_id or primary id) from Postgres. */
export async function getBenchmarkPg(id: string): Promise<Benchmark | null> {
  const rows = await query<Row>(
    "SELECT doc, verification_status, self_reported FROM benchmarks WHERE id = $1 OR benchmark_id = $1 LIMIT 1",
    [id],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/**
 * Insert a new (user-submitted) benchmark. Defaults to pending + self-reported
 * so it enters the verification queue rather than the board as trusted.
 * No-op on id conflict.
 */
export async function insertBenchmarkPg(b: Benchmark): Promise<void> {
  await query(
    `INSERT INTO benchmarks
       (id, benchmark_id, user_id, model_name, model_full_path, runtime, backend,
        quantization, gpu, cluster_size, data_source, submitted_at, doc,
        verification_status, self_reported)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (id) DO NOTHING`,
    [
      b.id,
      b.benchmarkId,
      b.userId ?? null,
      b.modelName ?? null,
      b.modelFullPath ?? null,
      b.runtime ?? null,
      b.backend ?? null,
      b.quantization ?? null,
      b.gpu ?? null,
      b.clusterSize ?? 1,
      b.dataSource ?? null,
      b.submittedAt ?? null,
      JSON.stringify(b),
      b.verificationStatus ?? "pending",
      b.selfReported ?? true,
    ],
  );
}

/**
 * Record the outcome of a verification rerun (DESIGN.md §4). Updates the promoted
 * column and merges the record into the stored doc. `failed` is a normal terminal
 * state — the row is kept on the board and opened for discussion, never deleted.
 */
export async function updateVerificationPg(
  id: string,
  rec: VerificationRecord,
): Promise<Benchmark | null> {
  const existing = await getBenchmarkPg(id);
  if (!existing) return null;
  const doc: Benchmark = {
    ...existing,
    verificationStatus: rec.status,
    verification: rec,
  };
  await query(
    `UPDATE benchmarks
        SET verification_status = $2,
            doc = $3
      WHERE id = $1 OR benchmark_id = $1`,
    [id, rec.status, JSON.stringify(doc)],
  );
  return doc;
}

/** All user-submitted benchmarks awaiting verification (admin queue). */
export async function getPendingPg(): Promise<Benchmark[]> {
  const rows = await query<Row>(
    "SELECT doc, verification_status, self_reported FROM benchmarks WHERE verification_status = 'pending' ORDER BY submitted_at DESC NULLS LAST",
  );
  return rows.map(hydrate);
}
