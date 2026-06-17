// Loads REAL benchmark data from InferStation (RDNA-only export) and maps it to
// the Radeon Arena Benchmark model. Every number here is a measured result —
// there is no synthetic/seed data in this project.
//
// Source: InferStation automated daily benchmarks (llama-benchy / stream client)
// Filtered to AMD RDNA devices only (Strix Halo / Radeon 8060S gfx1151,
// Radeon AI PRO R9700 gfx1200). NVIDIA and CDNA/Instinct rows are excluded.
import rawData from "@/data/inferstation-runs.json";
import type { Benchmark, BenchTest, Recipe } from "./types";

interface RawRun {
  run_date: string;
  host: { slug: string; name: string; vendor: string; chip: string; vram_gb?: number | null };
  model: { slug: string; name: string; params_b?: number | null; quantization: string; source_url?: string | null };
  engine: { slug: string; name: string; version?: string; commit?: string; backend?: string; build_flags?: string };
  pp_toks_per_s?: number | null;
  tg_toks_per_s?: number | null;
  ttft_ms?: number | null;
  tpot_ms?: number | null;
  combined_toks_per_s?: number | null;
  concurrency?: number | null;
  batch?: number | null;
  scenario?: string;
  image_tag?: string;
  notes?: string;
  id?: string;
}

interface RawFile {
  source: string;
  generated_at: string;
  runs: RawRun[];
}

const FILE = rawData as RawFile;

/** Derive the upstream model publisher from a model name (not the HF uploader). */
function publisherOf(modelName: string): string {
  const n = modelName.toLowerCase();
  if (n.includes("diffusiongemma") || n.startsWith("gemma")) return "Google";
  if (n.startsWith("qwen")) return "Qwen";
  if (n.startsWith("llama")) return "Meta";
  if (n.startsWith("mimo")) return "Xiaomi";
  if (n.startsWith("step")) return "StepFun";
  if (n.startsWith("mistral") || n.startsWith("mixtral")) return "Mistral AI";
  if (n.startsWith("phi")) return "Microsoft";
  if (n.startsWith("deepseek")) return "DeepSeek";
  if (n.startsWith("minimax")) return "MiniMax";
  if (n.includes("gpt-oss")) return "OpenAI";
  return modelName.split(/[-\s]/)[0];
}

/** A clean, human-readable GPU label from the InferStation host record. */
function gpuLabel(host: RawRun["host"]): string {
  const chip = host.chip || host.name;
  if (/strix\s*halo/i.test(chip) || /8060s/i.test(chip)) return "Radeon 8060S (Strix Halo)";
  if (/r9700/i.test(chip) || /r9700/i.test(host.name)) return "Radeon AI PRO R9700";
  return host.name;
}

function backendLabel(engine: RawRun["engine"]): string {
  return engine.backend || "";
}

function num(v: number | null | undefined): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

interface Group {
  key: string;
  runs: RawRun[];
}

/** Stable, filesystem-safe id from a group key. */
function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `is${h.toString(36)}`;
}

let cache: Benchmark[] | null = null;

/** Build the Benchmark[] from the real InferStation RDNA dataset. */
export function loadInferStationBenchmarks(): Benchmark[] {
  if (cache) return cache;

  // Group runs that belong to the same (device, model, engine+backend, quant)
  // configuration; each concurrency level becomes a pair of tests.
  const groups = new Map<string, Group>();
  for (const r of FILE.runs) {
    const key = [r.host.slug, r.model.slug, r.engine.slug, r.engine.backend, r.model.quantization].join("|");
    let g = groups.get(key);
    if (!g) {
      g = { key, runs: [] };
      groups.set(key, g);
    }
    g.runs.push(r);
  }

  const out: Benchmark[] = [];
  for (const g of groups.values()) {
    const sample = g.runs[0];
    const publisher = publisherOf(sample.model.name);
    const gpu = gpuLabel(sample.host);
    const backend = backendLabel(sample.engine);
    const runtime = sample.engine.name;
    const quant = sample.model.quantization;
    const id = hashId(g.key);

    const tests: BenchTest[] = [];
    let latestDate = sample.run_date;
    // Keep only the most recent run for each concurrency level (a config may be
    // re-benchmarked on multiple days; we show the latest real measurement).
    const byConc = new Map<number, RawRun>();
    for (const r of g.runs) {
      const c = r.concurrency ?? r.batch ?? 1;
      const prev = byConc.get(c);
      if (!prev || r.run_date >= prev.run_date) byConc.set(c, r);
      if (r.run_date > latestDate) latestDate = r.run_date;
    }
    for (const c of [...byConc.keys()].sort((a, b) => a - b)) {
      const r = byConc.get(c)!;
      const pp = num(r.pp_toks_per_s);
      const tg = num(r.tg_toks_per_s);
      const ttft = num(r.ttft_ms);
      if (pp !== undefined) {
        tests.push({ testName: `pp512 (c${c})`, tokensPerSec: round(pp), e2eTtft: ttft, ttfr: ttft });
      }
      if (tg !== undefined) {
        tests.push({
          testName: `tg128 (c${c})`,
          tokensPerSec: round(tg),
          e2eTtft: ttft,
          ttfr: ttft,
          tpotMs: num(r.tpot_ms),
        });
      }
    }
    if (tests.length === 0) continue;

    const decodeC1 = tests.find((t) => t.testName === "tg128 (c1)")?.tokensPerSec ?? 0;
    const prefillC1 = tests.find((t) => t.testName === "pp512 (c1)")?.tokensPerSec ?? 0;

    const recipe: Recipe = {
      name: `${sample.model.name} · ${runtime}${backend ? ` (${backend})` : ""} · ${quant}`,
      version: 1,
      command: "",
      container: sample.image_tag ? `inferstation/${sample.engine.slug}:${sample.image_tag}` : undefined,
      model: sample.model.source_url || undefined,
      description: `${runtime}${backend ? ` / ${backend}` : ""} serving of ${sample.model.name} (${quant}) on ${gpu}. Measured by InferStation (in512/out128 streaming benchmark).`,
      fullRecipe: {
        engine: runtime,
        engineVersion: sample.engine.version,
        engineCommit: sample.engine.commit,
        backend,
        buildFlags: sample.engine.build_flags,
        gpu,
        quantization: quant,
        scenario: sample.scenario,
        image: sample.image_tag,
      },
    };

    out.push({
      id,
      benchmarkId: id,
      submissionId: id,
      userId: sample.host.slug,
      creator: { name: sample.host.name },
      modelName: sample.model.name,
      modelFullPath: `${publisher}/${sample.model.name}`,
      modelHuggingFaceUrl: sample.model.source_url || undefined,
      runtime,
      backend,
      quantization: quant,
      clusterSize: 1,
      gpu,
      benchmarkType: "inferstation",
      recipeType: runtime.toLowerCase().includes("vllm") ? "rocm-vllm-docker" : "manual",
      recipe,
      recipeApproved: true,
      recipePermalinkId: id,
      recipeCopyCount: 0,
      tests,
      promptProcessingSpeed: prefillC1,
      aggregateScore: round(decodeC1 * 100 + prefillC1 / 10),
      tests_count: tests.length,
      submittedAt: `${latestDate}T00:00:00.000Z`,
      processedAt: `${latestDate}T00:00:00.000Z`,
      dataSource: "InferStation",
    } as Benchmark);
  }

  // Most-recent first for stable ordering.
  out.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  cache = out;
  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
