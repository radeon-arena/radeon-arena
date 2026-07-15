"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { hwLabel } from "@/lib/hardware";
import { loadGithubData, type Bundle } from "@/lib/githubData";

type BundleRecord = Bundle["records"][string][number];

const RADEONRUN = "https://github.com/radeon-arena/radeonrun";

function text(value: unknown, fallback = "-"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberText(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-";
}

function runtimeLabel(container: string): string {
  if (container === "llamacpp") return "llama.cpp";
  if (container === "vllm-main") return "vLLM main";
  if (container === "vllm") return "vLLM";
  return container || "Runtime";
}

function runtimeClass(container: string): string {
  if (container.includes("vllm")) return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  if (container.includes("llamacpp")) return "border-sky-400/40 bg-sky-400/10 text-sky-200";
  return "border-ink-600 bg-ink-800 text-zinc-300";
}

function modelName(recipe: Record<string, any>): string {
  const source = text(recipe.source, "");
  const model = text(recipe.model, "");
  return (source || model).split("/").filter(Boolean).pop() || text(recipe.name, "Recipe");
}

function modelAxis(record: BundleRecord, recipe: Record<string, any>, meta: Record<string, any>): Record<string, any> {
  return {
    name: text(record.model?.name, text(recipe.name, modelName(recipe))),
    path: text(record.model?.path, text(recipe.model, text(meta.model))),
    source: text(record.model?.source, text(recipe.source, "")),
    revision: text(record.model?.revision, ""),
    quantization: text(record.model?.quantization, text(recipe.metadata?.quantization, text(meta.quantization, "Unknown"))),
    description: text(record.model?.description, text(recipe.description, text(recipe.metadata?.description, ""))),
  };
}

function launchAxis(record: BundleRecord, recipe: Record<string, any>, meta: Record<string, any>): Record<string, any> {
  return {
    runtime: text(record.launch?.runtime, text(recipe.container, text(meta.runtime, text(meta.container, "unknown")))),
    container: text(record.launch?.container, text(recipe.container, text(meta.container, "unknown"))),
    image: text(record.launch?.image, imageRef(recipe, meta)),
    imageTag: text(record.launch?.image_tag, text(meta.image_tag, text(recipe.image_tag, ""))),
    imageCommit: text(record.launch?.image_commit, text(meta.image_commit, "")),
    imageId: text(record.launch?.image_id, text(meta.image_id, "")),
    imageRequested: text(record.launch?.image_requested, text(meta.image_requested, "")),
    imageResolved: text(record.launch?.image_resolved, text(meta.image_resolved, "")),
    imageDigest: text(record.launch?.image_digest, text(meta.image_digest, "")),
    command: text(record.launch?.command, text(meta.command, text(recipe.command, ""))),
    defaults: (record.launch?.defaults ?? recipe.defaults ?? {}) as Record<string, any>,
    env: (record.launch?.env ?? recipe.env ?? {}) as Record<string, any>,
    mods: (record.launch?.mods ?? recipe.mods ?? []) as unknown[],
  };
}

function specHref(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const path = value.split("#", 1)[0];
  return `${RADEONRUN}/blob/main/${path}`;
}

function benchmarkAxis(record: BundleRecord, data: Record<string, any>): Record<string, any> {
  const benchmark = record.benchmark ?? {};
  return {
    profile: text(benchmark.profile, text(data.profile, "profile")),
    profileFile: text(benchmark.profile_file, ""),
    framework: text(benchmark.framework, text(data.framework, "")),
    args: (benchmark.args ?? {}) as Record<string, any>,
    measurementCount: typeof benchmark.measurement_count === "number" ? benchmark.measurement_count : ((data.measurements ?? []) as unknown[]).length,
    failedPoints: benchmark.failed_points ?? data.failed_points,
    skippedPoints: benchmark.skipped_points ?? data.skipped_points,
    maxContext: benchmark.max_context ?? data.max_context,
    pointParams: (benchmark.point_params ?? []) as Record<string, any>[],
  };
}

function argsText(args: Record<string, any>): string {
  const parts = [
    ["depth", args.depth],
    ["pp", args.pp],
    ["tg", args.tg],
    ["concurrency", args.concurrency],
    ["runs", args.runs],
  ].filter(([, value]) => value !== undefined && value !== null);
  if (!parts.length) return "-";
  return parts.map(([key, value]) => `${key}=${Array.isArray(value) ? value.join("/") : value}`).join(" · ");
}

function bestMeasurement(record: BundleRecord): Record<string, any> | null {
  const measurements = ((record.data as any)?.measurements ?? []) as Record<string, any>[];
  let best: Record<string, any> | null = null;
  for (const measurement of measurements) {
    const value = measurement.decode_toks_per_s;
    if (typeof value !== "number") continue;
    if (!best || value > best.decode_toks_per_s) best = measurement;
  }
  return best;
}

function imageRef(recipe: Record<string, any>, meta: Record<string, any>): string {
  if (typeof meta.image === "string" && meta.image) return meta.image;
  const container = text(recipe.container, text(meta.container, ""));
  const tag = text(meta.image_tag, text(recipe.image_tag, "latest"));
  const imageName = container === "llamacpp" ? "halo-llamacpp" : container === "vllm-main" ? "halo-vllm-main" : container === "vllm" ? "halo-vllm" : container;
  return imageName.startsWith("ghcr.io/") ? imageName : `ghcr.io/radeon-arena/${imageName}:${tag}`;
}

export function RecipesView({ hw }: { hw: string }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [runtime, setRuntime] = useState("all");
  const [quant, setQuant] = useState("all");

  useEffect(() => {
    loadGithubData()
      .then((data) => setBundle(data.bundle))
      .catch(() => setError(true));
  }, []);

  const records = useMemo(() => (bundle?.records?.[hw] ?? []) as BundleRecord[], [bundle, hw]);

  const facets = useMemo(() => {
    const runtimes = new Set<string>();
    const quants = new Set<string>();
    for (const record of records) {
      const recipe = (record.recipe ?? {}) as Record<string, any>;
      const meta = ((record.data as any)?.meta ?? {}) as Record<string, any>;
      const model = modelAxis(record, recipe, meta);
      const launch = launchAxis(record, recipe, meta);
      runtimes.add(text(launch.container, text(launch.runtime, "unknown")));
      quants.add(text(model.quantization, "Unknown"));
    }
    return {
      runtimes: [...runtimes].sort(),
      quants: [...quants].sort(),
    };
  }, [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((record) => {
      const recipe = (record.recipe ?? {}) as Record<string, any>;
      const meta = ((record.data as any)?.meta ?? {}) as Record<string, any>;
      const model = modelAxis(record, recipe, meta);
      const launch = launchAxis(record, recipe, meta);
      const benchmark = benchmarkAxis(record, ((record.data as any) ?? {}) as Record<string, any>);
      const container = text(launch.container, text(launch.runtime, "unknown"));
      const quantization = text(model.quantization, "Unknown");
      const haystack = [record.recipe_file, recipe.name, model.name, model.description, model.path, model.source, launch.command, launch.image, benchmark.profile, benchmark.profileFile]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (runtime === "all" || container === runtime) && (quant === "all" || quantization === quant) && (!q || haystack.includes(q));
    });
  }, [records, query, runtime, quant]);

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-radeon-300">{hwLabel(hw)}</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-100">Recipes</h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Composable model, device, launch, and benchmark specs from radeonrun. Images may come from any OCI registry; results retain the requested ref and immutable digest when the registry exposes one.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:min-w-80 sm:flex-row sm:items-stretch">
            <div className="text-center text-xs text-zinc-400 sm:w-28">
              <div className="h-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2">
                <div className="text-lg font-semibold text-zinc-100">{records.length}</div>
                <div>recipes</div>
              </div>
            </div>
            <Link href={`/${hw}/submit`} className="btn-primary flex-1">
              Submit Recipe
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search model, source, image, or command"
            className="rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-zinc-200 outline-none ring-radeon-500/30 placeholder:text-zinc-600 focus:ring-2"
          />
          <select value={runtime} onChange={(event) => setRuntime(event.target.value)} className="rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-radeon-500/30">
            <option value="all">All runtimes</option>
            {facets.runtimes.map((item) => <option key={item} value={item}>{runtimeLabel(item)}</option>)}
          </select>
          <select value={quant} onChange={(event) => setQuant(event.target.value)} className="rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-radeon-500/30">
            <option value="all">All quantization</option>
            {facets.quants.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {error ? (
        <div className="card p-7 text-sm text-red-200">Failed to load recipe data.</div>
      ) : !bundle ? (
        <div className="card p-7 text-sm text-zinc-400">Loading recipes...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-7 text-sm text-zinc-400">No recipes match the current filters.</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((record) => {
            const recipe = (record.recipe ?? {}) as Record<string, any>;
            const data = (record.data as any) ?? {};
            const meta = (data.meta ?? {}) as Record<string, any>;
            const model = modelAxis(record, recipe, meta);
            const launch = launchAxis(record, recipe, meta);
            const benchmark = benchmarkAxis(record, data);
            const defaults = launch.defaults as Record<string, any>;
            const best = bestMeasurement(record);
            const container = text(launch.container, text(launch.runtime, "unknown"));
            const quantization = text(model.quantization, "Unknown");
            const recipeFile = text(record.recipe_file, "");
            const resultFile = text(record.file, "");

            return (
              <article key={resultFile || recipeFile || recipe.name} className="card overflow-hidden">
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs ${runtimeClass(container)}`}>{runtimeLabel(container)}</span>
                      <span className="chip">{quantization}</span>
                      <span className="chip">{text(benchmark.profile, "profile")}</span>
                      <span className="chip">{numberText(benchmark.measurementCount)} points</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-zinc-100">{text(model.name, modelName(recipe))}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{text(model.description)}</p>

                    <div className="mt-4 grid gap-3 text-sm lg:grid-cols-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-600">Model</div>
                        {typeof model.source === "string" && model.source ? (
                          <a href={`https://huggingface.co/${model.source}`} target="_blank" rel="noreferrer" className="break-all text-radeon-300 hover:text-radeon-200">{model.source}</a>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                        <div className="mt-1 break-all font-mono text-xs text-zinc-500">{text(model.path)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-600">Launch</div>
                        <div className="break-all font-mono text-xs text-zinc-300">{text(launch.image)}</div>
                        <div className="mt-1 text-xs text-zinc-500">runtime={runtimeLabel(container)} · tag={text(launch.imageTag)}</div>
                        {launch.imageResolved ? <div className="mt-1 break-all font-mono text-[11px] text-zinc-600">resolved={launch.imageResolved}</div> : null}
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-600">Benchmark Params</div>
                        <div className="font-mono text-xs text-zinc-300">{argsText(benchmark.args)}</div>
                        <div className="mt-1 font-mono text-xs text-zinc-500">serve: nseq={numberText(defaults.nseq)} · ctx={numberText(defaults.ctx)} · port={numberText(defaults.port)}</div>
                      </div>
                    </div>

                    <details className="mt-4 rounded-lg border border-ink-700 bg-ink-950">
                      <summary className="cursor-pointer px-3 py-2 text-sm text-zinc-300">Serve command</summary>
                      <pre className="thin-scroll overflow-auto border-t border-ink-700 p-3 font-mono text-xs text-zinc-300">{text(launch.command)}</pre>
                    </details>
                  </div>

                  <div className="rounded-lg border border-ink-700 bg-ink-950 p-4">
                    <div className="text-xs uppercase tracking-wide text-zinc-600">Best measured point</div>
                    {best ? (
                      <>
                        <div className="mt-2 text-3xl font-semibold text-zinc-100">{numberText(best.decode_toks_per_s)} <span className="text-sm font-normal text-zinc-500">tok/s</span></div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                          <div className="rounded-md bg-ink-900 p-2">C{numberText(best.concurrency)}</div>
                          <div className="rounded-md bg-ink-900 p-2">pp{numberText(best.pp)} / tg{numberText(best.tg)}</div>
                          <div className="rounded-md bg-ink-900 p-2">TTFT {numberText(best.ttft_ms)} ms</div>
                          <div className="rounded-md bg-ink-900 p-2">TPOT {numberText(best.tpot_ms)} ms</div>
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-500">No measured points in the current bundle.</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {record.matrix_file && <a href={specHref(record.matrix_file)} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">Matrix</a>}
                      {record.model_file && <a href={specHref(record.model_file)} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">Model spec</a>}
                      {record.launch_file && <a href={specHref(record.launch_file)} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">Launch spec</a>}
                      {record.device_file && <a href={specHref(record.device_file)} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">Device spec</a>}
                      {record.benchmark_file && <a href={specHref(record.benchmark_file)} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">Benchmark spec</a>}
                      {recipeFile && <a href={`${RADEONRUN}/blob/main/${recipeFile}`} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">Legacy recipe</a>}
                      {resultFile && <a href={`${RADEONRUN}/blob/main/${resultFile}`} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5">Result JSON</a>}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}