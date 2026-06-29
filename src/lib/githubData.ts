import { buildCarousel, buildSnapshot } from "./aggregate";
import { benchmarksFromRawRuns, type RawRun } from "./benchmarkMapping";
import { computeOrgLeaderboard, computeUserLeaderboard } from "./scoring";
import { hwMatches } from "./hardware";
import type { Benchmark, CarouselItem, LeaderboardSnapshot } from "./types";

const DEFAULT_BUNDLE_URL =
  "https://raw.githubusercontent.com/radeon-arena/radeonrun/main/results/bundle.json";

export type Bundle = {
  version: number;
  generated_at: string;
  repo: string;
  commit: string;
  short_commit: string;
  records: Record<string, { file: string; recipe_file?: string | null; recipe?: Record<string, unknown> | null; data: { generated_at?: string; measurements?: unknown[]; meta?: Record<string, unknown> } }[]>;
};

let promise: Promise<{ benchmarks: Benchmark[]; snapshot: LeaderboardSnapshot; carousel: { generatedAt: string; items: CarouselItem[] }; bundle: Bundle }> | null = null;

const ENGINE_IMAGE: Record<string, string> = {
  llamacpp: "halo-llamacpp",
  vllm: "halo-vllm",
  "vllm-main": "halo-vllm-main",
};

export function bundleUrl(): string {
  return process.env.NEXT_PUBLIC_RADEONRUN_BUNDLE_URL || DEFAULT_BUNDLE_URL;
}

function imageFromRecipe(
  metaImage: string | undefined,
  metaContainer: string | undefined,
  recipeContainer: string | undefined,
  tag: string | undefined,
): string | undefined {
  if (metaImage?.startsWith("ghcr.io/") || metaImage?.includes("/")) return tag && !metaImage.includes(":") ? `${metaImage}:${tag}` : metaImage;
  const logical = (recipeContainer || metaContainer || metaImage || "").split(":")[0];
  const imageName = ENGINE_IMAGE[logical];
  if (!imageName) return metaImage || metaContainer || recipeContainer;
  return `ghcr.io/radeon-arena/${imageName}:${tag || "latest"}`;
}

function rowsFromBundle(bundle: Bundle): RawRun[] {
  const rows: RawRun[] = [];
  for (const [device, records] of Object.entries(bundle.records ?? {})) {
    for (const rec of records ?? []) {
      const data = rec.data as any;
      const recipe = (rec.recipe ?? {}) as Record<string, any>;
      const meta = data.meta ?? {};
      const imageTag = typeof recipe.image_tag === "string" ? recipe.image_tag : undefined;
      const recipeContainer = typeof recipe.container === "string" ? recipe.container : undefined;
      const metaContainer = typeof meta.container === "string" ? meta.container : undefined;
      const tag = typeof meta.image_tag === "string" ? meta.image_tag : imageTag ?? (typeof meta.image === "string" ? meta.image.split(":").pop() : undefined);
      const image = imageFromRecipe(typeof meta.image === "string" ? meta.image : undefined, metaContainer, recipeContainer, tag);
      const runtimeRaw = String(meta.runtime ?? recipeContainer ?? metaContainer ?? "llamacpp").toLowerCase();
      const engineName = runtimeRaw.includes("vllm") ? "vLLM" : "llama.cpp";
      const engineSlug = runtimeRaw.includes("vllm") ? "vllm" : "llamacpp-hip";
      const backend = runtimeRaw.includes("vllm") ? "ROCm/HIP · TRITON_ATTN" : "ROCm/HIP";
      const modelPath = typeof recipe.source === "string" ? recipe.source : typeof recipe.model === "string" ? recipe.model : typeof meta.model === "string" ? meta.model : "";
      const modelName = modelPath.split("/").filter(Boolean).pop() || String(meta.recipe ?? rec.file).replace(/^results\/[^/]+\//, "").replace(/\.json$/, "");
      const recipeQuant = typeof recipe.metadata?.quantization === "string" ? recipe.metadata.quantization : undefined;
      const quant = String(meta.quantization ?? recipeQuant ?? modelName.match(/(bf16|fp8|q[248][-_][0-9a-z-]+|awq[-_a-z0-9]*)/i)?.[0] ?? "Unknown").toUpperCase();
      const gpu = device === "r9700" ? "Radeon AI PRO R9700" : device === "w7900" ? "Radeon PRO W7900" : "Strix Halo / Radeon 8060S (gfx1151)";
      const runDate = String(data.generated_at ?? bundle.generated_at ?? new Date().toISOString()).slice(0, 10);

      for (const m of data.measurements ?? []) {
        const mm = m as any;
        if (typeof mm.decode_toks_per_s !== "number") continue;
        rows.push({
          run_date: runDate,
          host: { slug: `radeonrun-${device}`, name: device === "strix" ? "Strix Halo" : gpu, vendor: "AMD", chip: gpu, vram_gb: device === "strix" ? 128 : undefined },
          model: { slug: String(recipe.name ?? modelName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: String(recipe.name ?? modelName), params_b: null, quantization: quant, source_url: modelPath && !modelPath.startsWith("/models/") ? `https://huggingface.co/${modelPath}` : undefined },
          engine: { slug: engineSlug, name: engineName, version: tag, commit: String(meta.image_commit ?? tag ?? ""), backend, build_flags: engineName === "llama.cpp" ? "-DGGML_HIP=ON (gfx1151)" : undefined },
          command: typeof meta.command === "string" ? meta.command : typeof recipe.command === "string" ? recipe.command : "",
          tg_test: `out${mm.tg ?? 128}`,
          tg_toks_per_s: mm.decode_toks_per_s,
          ttft_ms: mm.ttft_ms,
          tpot_ms: mm.tpot_ms,
          concurrency: mm.concurrency ?? 1,
          scenario: String(data.profile ?? "halo-arena-v1"),
          image,
          image_tag: tag,
          image_commit: String(meta.image_commit ?? tag ?? ""),
          image_id: typeof meta.image_id === "string" ? meta.image_id : undefined,
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
