# Radeon Arena

A static **LLM performance leaderboard for AMD Radeon GPUs**.

Radeon Arena is now a pure display site: it does not run benchmarks, accept web-form submissions, host an admin console, or maintain a database. The benchmark source of truth lives in [`radeon-arena/radeonrun`](https://github.com/radeon-arena/radeonrun), where recipes and measured result JSON files are versioned in git.

## Current Architecture

```mermaid
flowchart LR
  RR["radeonrun\nrecipes/*.yaml + results/*.json"] --> B["results/bundle.json"]
  B --> BUILD["pnpm build fetches bundle"]
  BUILD --> UI["Radeon Arena static site\n/data/bundle.json + client-side aggregation"]
```

- Data source: bundled static file `/data/bundle.json` (downloaded from `radeonrun/results/bundle.json` during `pnpm build`)
- Website: `https://radeon-arena.com/`
- No runtime API routes, no Postgres, no auth tokens, no admin UI
- Submit flow: users open a pull request in `radeon-arena/radeonrun` with a recipe and measured result file
- Public policy pages: `/terms`, `/privacy`, and `/data-policy`

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router, `output: "export"` |
| Styling | Tailwind CSS |
| Data | GitHub raw `radeonrun/results/bundle.json` |
| Hosting | Static web hosting |

## Development

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

Build the static export:

```bash
pnpm build
# output is written to ./out
```

## Production

Production serves the static export at:

```text
https://radeon-arena.com/
```

Deployment is a static-file publish of the generated `out/` directory.

## Static Export

```bash
pnpm build
# output is written to ./out
```

## Project Layout

```text
src/
  app/
    page.tsx                  # homepage
    [hw]/[[...rest]]/page.tsx  # /{hw}/{tab}
    blogs/page.tsx             # static blog shell
    terms/page.tsx             # terms of use
    privacy/page.tsx           # privacy notice
    data-policy/page.tsx        # benchmark data policy
    leaderboard/page.tsx       # legacy redirect to /strix/leaderboard
  components/
    Header, Footer, Carousel, leaderboard views
  lib/
    githubData.ts              # reads /data/bundle.json in the browser
    benchmarkMapping.ts         # maps raw radeonrun rows -> Benchmark[]
    aggregate.ts                # snapshot/carousel aggregation
    scoring.ts                  # users/orgs leaderboard scoring
    types.ts                    # domain model
```

## Data Flow

1. A recipe is added to `radeonrun/recipes/*.yaml`.
2. The radeonrun `reproduce.yml` workflow runs it on a self-hosted Radeon runner.
3. The workflow commits `results/<device>/<recipe>.json` plus regenerated `results/index.json` and `results/bundle.json`.
4. The radeon-arena build downloads that bundle into `public/data/bundle.json`.
5. The static site reads `/data/bundle.json` and aggregates the leaderboard in the browser.

## License

MIT
