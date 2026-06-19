-- radeon-arena Postgres schema
--
-- Design: each benchmark submission is stored as a full JSONB document (matching
-- the Benchmark TypeScript shape exactly, so the app layer needs no field-by-field
-- mapping), plus a handful of promoted columns for fast filtering/sorting on the
-- leaderboard (gpu for the hardware tabs, runtime, quantization, submitted_at).
--
-- Apply with:  psql "$DATABASE_URL" -f scripts/schema.sql
-- (idempotent: safe to re-run)

CREATE TABLE IF NOT EXISTS benchmarks (
  id              TEXT PRIMARY KEY,              -- benchmark id (== doc.benchmarkId)
  benchmark_id    TEXT NOT NULL,
  user_id         TEXT,
  model_name      TEXT,
  model_full_path TEXT,
  runtime         TEXT,
  backend         TEXT,
  quantization    TEXT,
  gpu             TEXT,                          -- drives the hardware tabs (strix/w7900/r9700)
  cluster_size    INTEGER DEFAULT 1,
  data_source     TEXT,                          -- provenance, e.g. "RadeonArena"
  submitted_at    TIMESTAMPTZ,
  doc             JSONB NOT NULL,                -- the full Benchmark object
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hardware-tab + leaderboard filters
CREATE INDEX IF NOT EXISTS idx_benchmarks_gpu          ON benchmarks (gpu);
CREATE INDEX IF NOT EXISTS idx_benchmarks_runtime      ON benchmarks (runtime);
CREATE INDEX IF NOT EXISTS idx_benchmarks_quant        ON benchmarks (quantization);
CREATE INDEX IF NOT EXISTS idx_benchmarks_submitted_at ON benchmarks (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmarks_model        ON benchmarks (model_full_path);
