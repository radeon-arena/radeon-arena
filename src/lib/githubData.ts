import { buildCarousel, buildSnapshot } from "./aggregate";
import { benchmarksFromRawRuns, type RawRun } from "./benchmarkMapping";
import { computeOrgLeaderboard, computeUserLeaderboard } from "./scoring";
import { hwMatches } from "./hardware";
import type { Benchmark, CarouselItem, LeaderboardSnapshot } from "./types";

const DEFAULT_BUNDLE_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/bundle.json`;

export type Bundle = {
  version: number;
  generated_at: string;
  repo: string;
  commit: string;
  short_commit: string;
  records: Record<string, {
    file: string;
    config_source?: string;
    spec_files?: Record<string, string | null>;
    matrix_file?: string | null;
    model_file?: string | null;
    launch_file?: string | null;
    device_file?: string | null;
    benchmark_file?: string | null;
    recipe_file?: string | null;
    recipe?: Record<string, unknown> | null;
    data: { generated_at?: string; measurements?: unknown[]; meta?: Record<string, unknown>; profile?: string };
    device?: { id?: string; key?: string; result_key?: string; image_device?: string; label?: string; gpu?: string; arch?: string | null; arch_aliases?: string[]; runner_labels?: string[]; topology?: Record<string, unknown> };
    model?: { id?: string; name?: string; path?: string; source?: string; revision?: string | null; served_name?: string; quantization?: string; description?: string; patches?: unknown[] };
    launch?: { id?: string; runtime?: string; container?: string; image?: string; image_requested?: string; image_resolved?: string; image_digest?: string; image_tag?: string; image_commit?: string; image_id?: string; command?: string; defaults?: Record<string, unknown>; env?: Record<string, unknown>; mods?: unknown[] };
    benchmark?: { profile?: string; profile_file?: string | null; framework?: string; metadata?: Record<string, unknown>; args?: Record<string, unknown>; schedule?: unknown[] | null; measurement_count?: number; point_params?: unknown[]; failed_points?: number | null; skipped_points?: number | null; max_context?: number | null };
  }[]>;
};

let promise: Promise<{ benchmarks: Benchmark[]; snapshot: LeaderboardSnapshot; carousel: { generatedAt: string; items: CarouselItem[] }; bundle: Bundle }> | null = null;

const ENGINE_IMAGE: Record<string, Record<string, string>> = {
  strix: { llamacpp: "halo-llamacpp", vllm: "halo-vllm", "vllm-main": "halo-vllm-main" },
  w7900: { llamacpp: "w7900-llamacpp", vllm: "w7900-vllm", "vllm-main": "w7900-vllm-main" },
  r9700: { llamacpp: "r9700-llamacpp", vllm: "r9700-vllm", "vllm-main": "r9700-vllm-main" },
};

const DEVICE_GPU: Record<string, string> = {
  strix: "Strix Halo / Radeon 8060S (gfx1151)",
  w7900: "Radeon PRO W7900",
  r9700: "Radeon AI PRO R9700",
};

const DEVICE_ARCH: Record<string, string> = {
  strix: "gfx1151",
  w7900: "gfx1100",
  r9700: "gfx1201",
};

export function bundleUrl(): string {
  return DEFAULT_BUNDLE_URL;
}

function imageFromRecipe(
  device: string,
  metaImage: string | undefined,
  metaContainer: string | undefined,
  recipeContainer: string | undefined,
  tag: string | undefined,
): string | undefined {
  if (metaImage?.startsWith("ghcr.io/") || metaImage?.includes("/")) return tag && !metaImage.includes(":") ? `${metaImage}:${tag}` : metaImage;
  const logical = (recipeContainer || metaContainer || metaImage || "").split(":")[0];
  const imageName = ENGINE_IMAGE[device]?.[logical] ?? ENGINE_IMAGE.strix[logical];
  if (!imageName) return metaImage || metaContainer || recipeContainer;
  return `ghcr.io/radeon-arena/${imageName}:${tag || "latest"}`;
}

function logicalRuntime(launchRuntime: string | undefined, recipeContainer: string | undefined, metaContainer: string | undefined): string {
  return String(launchRuntime ?? recipeContainer ?? metaContainer ?? "llamacpp").toLowerCase();
}

function buildFlags(device: string, engineName: string): string | undefined {
  if (engineName !== "llama.cpp") return undefined;
  const arch = DEVICE_ARCH[device];
  return arch ? `-DGGML_HIP=ON (${arch})` : "-DGGML_HIP=ON";
}

function rowsFromBundle(bundle: Bundle): RawRun[] {
  const rows: RawRun[] = [];
  for (const [device, records] of Object.entries(bundle.records ?? {})) {
    for (const rec of records ?? []) {
      const data = rec.data as any;
      const recipe = (rec.recipe ?? {}) as Record<string, any>;
      const meta = data.meta ?? {};
      const modelAxis = rec.model ?? {};
      const launchAxis = rec.launch ?? {};
      const deviceAxis = rec.device ?? {};
      const imageTag = typeof recipe.image_tag === "string" ? recipe.image_tag : undefined;
      const recipeContainer = typeof recipe.container === "string" ? recipe.container : undefined;
      const metaContainer = typeof meta.container === "string" ? meta.container : undefined;
      const tag = typeof launchAxis.image_tag === "string" ? launchAxis.image_tag : typeof meta.image_tag === "string" ? meta.image_tag : imageTag ?? (typeof meta.image === "string" ? meta.image.split(":").pop() : undefined);
      const image = typeof launchAxis.image === "string" && launchAxis.image ? launchAxis.image : imageFromRecipe(device, typeof meta.image === "string" ? meta.image : undefined, metaContainer, recipeContainer, tag);
      const runtimeRaw = logicalRuntime(launchAxis.runtime, recipeContainer, metaContainer);
      const engineName = runtimeRaw.includes("vllm") ? "vLLM" : "llama.cpp";
      const engineSlug = runtimeRaw.includes("vllm") ? "vllm" : "llamacpp-hip";
      const backend = runtimeRaw.includes("vllm") ? "ROCm/HIP · TRITON_ATTN" : "ROCm/HIP";
      const modelPath = typeof modelAxis.source === "string" ? modelAxis.source : typeof recipe.source === "string" ? recipe.source : typeof recipe.model === "string" ? recipe.model : typeof meta.model === "string" ? meta.model : "";
      const modelName = typeof modelAxis.name === "string" && modelAxis.name ? modelAxis.name : modelPath.split("/").filter(Boolean).pop() || String(meta.recipe ?? rec.file).replace(/^results\/[^/]+\//, "").replace(/\.json$/, "");
      const recipeQuant = typeof recipe.metadata?.quantization === "string" ? recipe.metadata.quantization : undefined;
      const quant = String(modelAxis.quantization ?? meta.quantization ?? recipeQuant ?? modelName.match(/(bf16|fp8|q[248][-_][0-9a-z-]+|awq[-_a-z0-9]*)/i)?.[0] ?? "Unknown").toUpperCase();
      const gpu = typeof deviceAxis.gpu === "string" && deviceAxis.gpu ? deviceAxis.gpu : DEVICE_GPU[device] ?? device;
      const runDate = String(data.generated_at ?? bundle.generated_at ?? new Date().toISOString()).slice(0, 10);

      for (const m of data.measurements ?? []) {
        const mm = m as any;
        if (typeof mm.decode_toks_per_s !== "number" && typeof mm.prefill_toks_per_s !== "number") continue;
        const depth = typeof mm.depth === "number" ? mm.depth : 0;
        rows.push({
          run_date: runDate,
          host: { slug: `radeonrun-${device}`, name: device === "strix" ? "Strix Halo" : gpu, vendor: "AMD", chip: gpu, vram_gb: device === "strix" ? 128 : undefined },
          model: { slug: String(recipe.name ?? modelName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: String(recipe.name ?? modelName), params_b: null, quantization: quant, source_url: modelPath && !modelPath.startsWith("/models/") ? `https://huggingface.co/${modelPath}` : undefined },
          engine: { slug: engineSlug, name: engineName, version: tag, commit: String(launchAxis.image_commit ?? meta.image_commit ?? tag ?? ""), backend, build_flags: buildFlags(device, engineName) },
          command: typeof launchAxis.command === "string" ? launchAxis.command : typeof meta.command === "string" ? meta.command : typeof recipe.command === "string" ? recipe.command : "",
          pp: mm.pp,
          pp_toks_per_s: mm.prefill_toks_per_s,
          tg: mm.tg,
          tg_test: `out${mm.tg ?? 128}`,
          tg_toks_per_s: mm.decode_toks_per_s,
          ttft_ms: mm.ttft_ms,
          tpot_ms: mm.tpot_ms,
          concurrency: mm.concurrency ?? 1,
          depth,
          scenario: String(data.profile ?? "halo-arena-v1"),
          image,
          image_tag: tag,
          image_commit: String(launchAxis.image_commit ?? meta.image_commit ?? tag ?? ""),
          image_id: typeof launchAxis.image_id === "string" ? launchAxis.image_id : typeof meta.image_id === "string" ? meta.image_id : undefined,
          image_requested: typeof launchAxis.image_requested === "string" ? launchAxis.image_requested : undefined,
          image_resolved: typeof launchAxis.image_resolved === "string" ? launchAxis.image_resolved : undefined,
          image_digest: typeof launchAxis.image_digest === "string" ? launchAxis.image_digest : undefined,
          config_source: rec.config_source,
          spec_files: rec.spec_files ?? {},
          deviceAxis,
          modelAxis,
          launchAxis,
          benchmarkAxis: rec.benchmark ?? {},
          configAxis: {
            matrix_id: String(rec.file).split("/").pop()?.replace(/\.json$/, ""),
            source: rec.config_source ?? "legacy",
            spec_files: rec.spec_files ?? {},
            matrix_file: rec.matrix_file,
            model_file: rec.model_file,
            launch_file: rec.launch_file,
            device_file: rec.device_file,
            benchmark_file: rec.benchmark_file,
            legacy_recipe: rec.recipe_file,
          },
          id: rec.file,
        } as RawRun);
      }
    }
  }
  return rows;
}

export async function loadGithubData() {
  if (!promise) {
    promise = fetch(bundleUrl(), { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`failed to load radeonrun bundle: ${r.status}`);
        return r.json() as Promise<Bundle>;
      })
      .then((bundle) => {
        const benchmarks = benchmarksFromRawRuns(rowsFromBundle(bundle));
        return { benchmarks, snapshot: buildSnapshot(benchmarks), carousel: buildCarousel(benchmarks), bundle };
      });
  }
  return promise;
}

export async function getGithubBenchmark(id: string): Promise<Benchmark | null> {
  const { benchmarks } = await loadGithubData();
  return benchmarks.find((b) => b.id === id || b.benchmarkId === id || b.recipePermalinkId === id) ?? null;
}

export async function getGithubUsers(hw: string) {
  const { benchmarks } = await loadGithubData();
  return computeUserLeaderboard(benchmarks.filter((b) => hwMatches(hw, b.gpu)));
}

export async function getGithubOrganizations(hw: string) {
  const { benchmarks } = await loadGithubData();
  return computeOrgLeaderboard(benchmarks.filter((b) => hwMatches(hw, b.gpu)));
}
