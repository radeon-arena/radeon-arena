"use client";

import { useEffect, useMemo, useState } from "react";
import yaml from "js-yaml";
import type { Benchmark } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { PROJECTS } from "@/lib/site";
import { VerificationBadge } from "./VerificationBadge";
import { getGithubBenchmark } from "@/lib/githubData";

const HALO = PROJECTS.benchy; // radeonrun

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
    getGithubBenchmark(id)
      .then((d) => {
        if (alive && d) setData(d);
        else if (alive) setError(true);
      })
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
  const rawUrl = "#recipe";

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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-8"
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Measured by</p>
                <VerificationBadge status={data.verificationStatus} />
              </div>
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
              {data.verification && (
                <div className="mt-3 rounded-lg border border-ink-700 bg-ink-950 p-3 text-xs text-zinc-400">
                  <p>
                    Verification: reported{" "}
                    <span className="font-mono text-zinc-200">{data.verification.reportedTps ?? "—"}</span> vs measured{" "}
                    <span className="font-mono text-zinc-200">{data.verification.measuredTps ?? "—"}</span> tok/s
                    {typeof data.verification.deviationPct === "number" ? <> · Δ {data.verification.deviationPct}%</> : null}
                  </p>
                  {data.verification.runner && (
                    <p className="mt-0.5 text-zinc-600">
                      reran by {data.verification.runner}
                      {data.verification.verifiedAt ? ` · ${fmtDate(data.verification.verifiedAt)}` : ""}
                    </p>
                  )}
                  {data.verification.note && <p className="mt-0.5 text-zinc-500">{data.verification.note}</p>}
                </div>
              )}
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

            {/* Reproducibility — the exact build that produced this number */}
            <ReproducibilitySection benchmark={data} />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {data.modelHuggingFaceUrl && (
                <a href={data.modelHuggingFaceUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  View on Hugging Face ↗
                </a>
              )}
              <button onClick={copyRecipe} className="btn-ghost">Download recipe (copy YAML)</button>
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
# Copy the recipe YAML above into recipe.yaml

# 2. Clone the toolkit
git clone ${HALO.url}.git
cd radeonrun

# 3. Run it
python run-recipe.py recipe.yaml`}
              </pre>
            </section>

            <section className="border-t border-ink-800 pt-5">
              <h3 className="text-sm font-semibold text-radeon-300">Discussion</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Radeon Arena is a static display site. Discuss result changes in the GitHub pull request that adds or updates the benchmark data.
              </p>
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

function pickStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function imageHref(image: string): string | undefined {
  if (/^https?:\/\//i.test(image)) return image;
  const ref = image.replace(/^ghcr\.io\//, "");
  const [name] = ref.split(":");
  if (!name.includes("/")) return undefined;
  return `https://github.com/${name}/pkgs/container/${encodeURIComponent(name.split("/").pop() ?? "")}`;
}

/**
 * Reproducibility provenance — surfaces the exact build (pinned container image,
 * engine build commit, image digest, build flags) that produced this number.
 * Radeon Arena is a performance leaderboard: each result is tied to the precise
 * image that produced it, never a moving `:latest` tag. Renders only the fields
 * present in the recipe, so older records degrade gracefully.
 */
function ReproducibilitySection({ benchmark }: { benchmark: Benchmark }) {
  const fr = (benchmark.recipe?.fullRecipe ?? {}) as Record<string, unknown>;
  const image = pickStr(fr.image) || pickStr(benchmark.recipe?.container);
  const imageTag = pickStr(fr.imageTag);
  const imageCommit = pickStr(fr.imageCommit);
  const imageId = pickStr(fr.imageId);
  const engineCommit = pickStr(fr.engineCommit);
  const engineVersion = pickStr(fr.engineVersion);
  const buildFlags = pickStr(fr.buildFlags);

  const engineLine = [benchmark.runtime, engineVersion, engineCommit ? `@ ${engineCommit.slice(0, 12)}` : undefined]
    .filter(Boolean)
    .join(" ");

  const rows: { label: string; value: string; href?: string }[] = [];
  if (image) {
    const value = imageTag && !image.includes(":") ? `${image}:${imageTag}` : image;
    rows.push({ label: "Container image", value, href: imageHref(value) });
  }
  if (imageCommit) rows.push({ label: "Image build commit", value: imageCommit });
  if (imageId) rows.push({ label: "Image digest", value: imageId });
  if (engineLine.trim()) rows.push({ label: "Engine", value: engineLine });
  if (buildFlags) rows.push({ label: "Build flags", value: buildFlags });

  if (rows.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold text-radeon-300">Reproducibility</h3>
      <p className="mt-1 text-xs text-zinc-500">
        The exact build that produced this number — pinned image + engine commit, so the result reproduces from this recipe alone (never a moving <span className="font-mono">:latest</span> tag).
      </p>
      <dl className="mt-2 space-y-2 rounded-xl border border-ink-800 bg-ink-950/50 p-4">
        {rows.map((r) => (
          <Provenance key={r.label} label={r.label} value={r.value} href={r.href} />
        ))}
      </dl>
    </section>
  );
}

function Provenance({ label, value, href }: { label: string; value: string; href?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="shrink-0 text-xs text-zinc-500 sm:w-32">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-baseline gap-2">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-radeon-400 hover:text-radeon-300 hover:underline">
            {value}
          </a>
        ) : (
          <span className="break-all font-mono text-xs text-zinc-300">{value}</span>
        )}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {
              /* clipboard unavailable */
            }
          }}
          className="shrink-0 text-[11px] text-zinc-600 hover:text-radeon-300"
          aria-label={`Copy ${label}`}
        >
          {copied ? "✓" : "copy"}
        </button>
      </dd>
    </div>
  );
}

