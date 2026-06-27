// Import the current RadeonArena benchmarks into Postgres.
//
// Reuses loadBenchmarks() so the rows in PG are byte-identical to
// what the site renders today from the bundled JSON — this is the one-time
// migration from "static JSON" to "live database".
//
// Usage:
//   DATABASE_URL=postgres://user:pass@host:5432/radeon_arena pnpm tsx scripts/import-to-pg.ts
//
// Idempotent: upserts by id, so re-running refreshes rows in place.

import { Pool } from "pg";
import { loadBenchmarks } from "../src/lib/benchmarkData";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const benchmarks = loadBenchmarks();
  console.log(`Loaded ${benchmarks.length} benchmarks from the bundled dataset.`);

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  let inserted = 0;
  try {
    await client.query("BEGIN");
    for (const b of benchmarks) {
      await client.query(
        `INSERT INTO benchmarks
           (id, benchmark_id, user_id, model_name, model_full_path, runtime,
            backend, quantization, gpu, cluster_size, data_source, submitted_at, doc)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           benchmark_id    = EXCLUDED.benchmark_id,
           user_id         = EXCLUDED.user_id,
           model_name      = EXCLUDED.model_name,
           model_full_path = EXCLUDED.model_full_path,
           runtime         = EXCLUDED.runtime,
           backend         = EXCLUDED.backend,
           quantization    = EXCLUDED.quantization,
           gpu             = EXCLUDED.gpu,
           cluster_size    = EXCLUDED.cluster_size,
           data_source     = EXCLUDED.data_source,
           submitted_at    = EXCLUDED.submitted_at,
           doc             = EXCLUDED.doc`,
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
        ],
      );
      inserted += 1;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`Upserted ${inserted} rows into benchmarks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
