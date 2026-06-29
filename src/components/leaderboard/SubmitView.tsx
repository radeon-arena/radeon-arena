import { PROJECTS } from "@/lib/site";

// radeonrun is the engine/runner repo; submissions are PRs against it.
const RR = PROJECTS.benchy.url;

const lbl = "font-medium text-zinc-100";

export function SubmitView({ hw }: { hw?: string }) {
  void hw;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card p-6 text-sm leading-relaxed text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-100">Submit a result via a radeonrun PR</h2>
        <p className="mt-2 text-zinc-400">
          Radeon Arena doesn&apos;t take numbers from a web form. You run{" "}
          <a href={RR} className="text-radeon-400 hover:text-radeon-300">radeonrun</a> on your own Radeon,
          commit the results JSON, and open a pull request. After it merges, the site ingests it and a
          runner reruns the recipe to verify — matched ✓, or kept as ⚠ repro-failed and open for
          discussion. Nothing skips the recipe.
        </p>

        <ol className="mt-5 space-y-5">
          <li>
            <h3 className={lbl}>1 · Run the recipe on your hardware</h3>
            <p className="text-zinc-400">Pick an existing recipe (or add one), then benchmark it.</p>
            <pre className="thin-scroll mt-2 overflow-x-auto rounded-lg border border-ink-700 bg-ink-850 p-3 font-mono text-xs text-zinc-200">
{`git clone ${RR}
cd radeonrun
python run-recipe.py <recipe> \\
  --benchmark benchmarking/halo-arena-v1.yaml --out results/
# -> results/strix/<recipe>.json  (w7900 / r9700 dirs for other cards)`}
            </pre>
          </li>
          <li>
            <h3 className={lbl}>2 · Open a PR with the results JSON</h3>
            <p className="text-zinc-400">
              Add only <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-100">results/&lt;device&gt;/&lt;recipe&gt;.json</code>.
              Need a new image? Include the recipe + Dockerfile; CI builds it to GHCR on merge. Pin the
              image tag to its commit — <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-100">:latest</code> never enters the board.
            </p>
          </li>
          <li>
            <h3 className={lbl}>3 · Merge → board</h3>
            <p className="text-zinc-400">
              On merge the site ingests your numbers; a runner reruns the recipe and stamps the row
              ✓ verified or ⚠ repro-failed (kept, discussed — never deleted).
            </p>
          </li>
        </ol>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={RR} className="btn-primary">Open radeonrun</a>
          <a href={`${RR}/tree/main/recipes`} className="btn-ghost">Recipes</a>
          <a href={`${RR}/tree/main/results`} className="btn-ghost">Results</a>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500">
        Measurement uses <code>serve-stream-in512-out128</code> at concurrency 1 / 4 / 16 / 32 — see the
        How-to tab for the exact profile.
      </p>
    </div>
  );
}
