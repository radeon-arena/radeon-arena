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

-- ── Verification & provenance (DESIGN.md §4) ──────────────────────────────
-- Every row carries a verification status so the board can show it openly:
--   self     = first-party RadeonArena runner result (auto-runner / daily CI) → trusted
--   pending  = user-submitted, awaiting a verification rerun
--   verified = rerun matched the self-reported value within tolerance          → ✅
--   failed   = rerun did NOT match — KEPT and opened for discussion, never dropped → ⚠️
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'self';
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS self_reported       BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_benchmarks_verification ON benchmarks (verification_status);

-- Community discussion attached to a benchmark (especially ⚠️ reproduction-failed
-- entries, which stay on the board and are opened for debate rather than removed).
CREATE TABLE IF NOT EXISTS discussions (
  id            TEXT PRIMARY KEY,
  benchmark_id  TEXT NOT NULL REFERENCES benchmarks(id) ON DELETE CASCADE,
  author        TEXT NOT NULL,
  author_avatar TEXT,
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_discussions_benchmark ON discussions (benchmark_id, created_at);
