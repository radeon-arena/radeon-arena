"use client";

import { useEffect, useMemo, useState } from "react";
import yaml from "js-yaml";
import type { Benchmark } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { PROJECTS } from "@/lib/site";

const HALO = PROJECTS.benchy; // radeon-docker

function clusterLabel(n: number): string {
  return n <= 1 ? "Single Node" : `${n} Nodes`;
}

export function BenchmarkModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<Benchmark | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(false);
    fetch(`/api/benchmarks/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Benchmark) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const recipeYaml = useMemo(() => {
    if (!data?.recipe) return "";
    try {
      return yaml.dump(data.recipe.fullRecipe ?? data.recipe, { indent: 2, lineWidth: -1, noRefs: true });
    } catch {
      return data.recipe.command ?? "";
    }
  }, [data]);

  const permalinkId = data?.recipePermalinkId ?? data?.benchmarkId ?? id;
  const rawUrl = `/api/recipes/${encodeURIComponent(permalinkId)}/raw`;

  async function copyRecipe() {
    try {
      await navigator.clipboard.writeText(recipeYaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="card thin-scroll my-auto w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-ink-800 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-100 break-all">
            {data?.modelFullPath || data?.modelName || "Benchmark"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg border border-ink-700 px-2.5 py-1 text-sm text-zinc-400 hover:bg-ink-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {error && <p className="px-6 py-10 text-center text-zinc-500">Failed to load this benchmark.</p>}
        {!error && !data && <p className="px-6 py-10 text-center text-zinc-500">Loading…</p>}

        {data && (
          <div className="space-y-6 px-6 py-5">
            {/* Measured by — automated source, not a person */}
            <section className="rounded-xl border border-ink-800 bg-ink-950/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Measured by</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 text-zinc-300">
                  {/* automated/benchmark glyph, not an avatar */}
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="12" rx="1.5" />
                    <path d="M8 20h8M12 16v4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-200">{data.dataSource || "RadeonArena"}</p>
                  <p className="text-xs text-zinc-500">
                    Automated benchmark harness · {data.creator?.name || data.gpu}
                  </p>
                </div>
              </div>
            </section>

            {/* Model Information */}
            <section>
              <h3 className="text-sm font-semibold text-radeon-300">Model Information</h3>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-ink-800 bg-ink-950/50 p-4 text-sm">
                <Info label="Runtime" value={data.runtime} sub={data.backend} />
                <Info label="Cluster Size" value={clusterLabel(data.clusterSize)} />
                <Info label="GPU" value={data.gpu} />
                <Info label="Quantization" value={data.quantization} />
                <Info label="Tests" value={`${data.tests_count ?? data.tests?.length ?? 0} tests`} />
                <Info label="Measured" value={fmtDate(data.submittedAt)} />
              </dl>
            </section>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {data.modelHuggingFaceUrl && (
                <a href={data.modelHuggingFaceUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  View on Hugging Face ↗
                </a>
              )}
              <a href={rawUrl} className="btn-ghost">Download recipe (YAML)</a>
            </div>

            {/* Recipe */}
            {recipeYaml && (
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-radeon-300">Recipe</h3>
                  <button onClick={copyRecipe} className="chip hover:border-radeon-600 hover:text-radeon-300">
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                {data.recipe?.description && (
                  <p className="mt-2 text-sm text-zinc-400">{data.recipe.description}</p>
                )}
                <pre className="thin-scroll mt-2 max-h-72 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs leading-relaxed text-zinc-300">
                  {recipeYaml}
                </pre>
              </section>
            )}

            {/* How to Use */}
            <section className="border-t border-ink-800 pt-5">
              <h3 className="text-sm font-semibold text-radeon-300">How to Use</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Reproduce this run with{" "}
                <a href={HALO.url} target="_blank" rel="noreferrer" className="text-radeon-400 hover:text-radeon-300">
                  {HALO.name}
                </a>{" "}
                — AMD ROCm containers &amp; recipes for Radeon.
              </p>
              <pre className="thin-scroll mt-2 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs leading-relaxed text-zinc-300">
{`# 1. Get the recipe
curl -L ${rawUrl} -o recipe.yaml

# 2. Clone the toolkit
git clone ${HALO.url}.git
cd radeon-docker

# 3. Run it
python run-recipe.py recipe.yaml`}
              </pre>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, sub }: { label: string; value?: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-200">
        {value || "—"}
        {sub ? <span className="block text-xs font-normal text-zinc-500">{sub}</span> : null}
      </dd>
    </div>
  );
}
