# Radeon Arena

A community-driven **LLM performance leaderboard for AMD Radeon GPUs**. Real
recipes, multiple runtimes (vLLM / SGLang / llama.cpp / MLC-LLM), full
reproducibility — every result carries the exact serve command, quantization,
GPU and cluster topology used to produce it.

> **Disclaimer** — This is an **independent, community-built project** and is not
> affiliated with or endorsed by AMD. It is a from-scratch reimplementation of
> the architecture popularized by *Spark Arena* (NVIDIA DGX Spark), retargeted to
> the AMD Radeon / ROCm ecosystem. The bundled dataset is **real benchmark data**
> measured on AMD RDNA hardware (Strix Halo / R9700), RDNA-only. New results are
> submitted via the **Submit** tab and **verified by re-running the recipe**
> before they show as verified — self-reported numbers are never trusted blindly.

## Stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 14 (App Router, route handlers)             |
| Styling      | Tailwind CSS                                         |
| Database     | Postgres (JSONB) → bundled JSON fallback (two-tier) |
| Auth         | Token (`ADMIN_TOKEN` / `SUBMIT_TOKEN`) — gates `/admin`, verify & submit |
| Hosting      | Docker Compose (app + Postgres) — see `docker-compose.yml` |

The leaderboard is served from a periodically-regenerated **snapshot** (cached
in-memory, refresh interval `SNAPSHOT_INTERVAL_HOURS`) rather than aggregating on
every request.

## Quick start (offline / fallback mode)

No database required — the app falls back to the bundled JSON dataset:

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

## With Postgres (full: submit + verify + discussion)

```bash
# 1. bring up app + Postgres
docker compose up -d --build

# 2. apply schema + import the bundled dataset
docker exec -i radeon-arena-db psql -U radeon -d radeon_arena < scripts/schema.sql
DATABASE_URL=postgres://radeon:radeon_arena_pw@localhost:5432/radeon_arena pnpm db:import
```

Set `ADMIN_TOKEN` (admin + verify) and `SUBMIT_TOKEN` (submit + comment) in `.env`
to enable the admin console and result submission — no external auth provider.

## API

| Endpoint                              | Description                                  |
| ------------------------------------- | -------------------------------------------- |
| `GET /static/snapshot`                | Full per-test leaderboard aggregate          |
| `GET /static/carousel`                | Homepage highlight reel                       |
| `GET /api/leaderboard/users`          | Contributor ranking (no PII / emails exposed) |
| `GET /api/leaderboard/organizations`  | Model-publisher ranking                       |
| `GET /api/benchmarks/:id`             | Full submission detail incl. recipe + tests   |
| `GET /api/recipes/:id/raw`            | Download a recipe as YAML                      |
| `POST /api/generate-recipe`           | Structure a serve command (public)            |
| `POST /api/submit`                    | Submit a result (`SUBMIT_TOKEN`) → pending     |
| `GET/POST /api/benchmarks/:id/discussion` | Read / add discussion posts               |
| `GET /api/admin/pending`              | Verification queue (`ADMIN_TOKEN`)            |
| `POST /api/admin/verify/:id`          | Verify a submission (`ADMIN_TOKEN`)           |

## Scripts

```bash
pnpm dev        # local dev server
pnpm build      # production build
pnpm db:schema  # apply Postgres schema
pnpm db:import  # import the bundled dataset into Postgres
pnpm snapshot   # emit snapshot.sample.json + carousel.sample.json
```

## Project layout

```
src/
  app/
    page.tsx                 # homepage
    [hw]/[[...rest]]/page.tsx # /{hw}/{tab} — leaderboard + 7 tabs
    admin/page.tsx           # moderation console (token-gated)
    static/{snapshot,carousel}/route.ts
    api/{submit,admin/verify,admin/pending,benchmarks,recipes,generate-recipe}/...
  components/                # Header, Footer, Carousel, leaderboard views (SubmitView, VerificationBadge, ...)
  lib/
    types.ts                 # domain model (Benchmark, VerificationStatus, ...)
    benchmarkData.ts         # real RDNA dataset → Benchmark mapping
    aggregate.ts             # pure snapshot/carousel builders
    dataSource.ts            # Postgres-or-JSON IO layer
    pgSource.ts              # Postgres read/write
    auth.ts, clientAuth.ts   # token auth (server / client)
    discussions.ts           # discussion CRUD
    scoring.ts               # contributor/org score model
scripts/                     # schema.sql + import-to-pg + snapshot
```
```

## Notes on data hygiene

Unlike some leaderboards, `GET /api/leaderboard/users` here **does not** return
contributor email addresses. Keep PII out of public aggregates.

## License

MIT
