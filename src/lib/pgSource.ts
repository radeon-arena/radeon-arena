import "server-only";

import type { Benchmark } from "./types";
import { query } from "./db";

// Each row stores the full Benchmark object in `doc`. We select only that and
// rehydrate, so the rest of the app is agnostic to the storage backend.
interface Row {
  doc: Benchmark;
}

/** Fetch every benchmark submission from Postgres. */
export async function getAllBenchmarksPg(): Promise<Benchmark[]> {
  const rows = await query<Row>("SELECT doc FROM benchmarks");
  return rows.map((r) => r.doc);
}

/** Fetch one benchmark by id (benchmark_id or primary id) from Postgres. */
export async function getBenchmarkPg(id: string): Promise<Benchmark | null> {
  const rows = await query<Row>(
    "SELECT doc FROM benchmarks WHERE id = $1 OR benchmark_id = $1 LIMIT 1",
    [id],
  );
  return rows[0]?.doc ?? null;
}
