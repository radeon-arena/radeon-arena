import type { Benchmark, BenchTest, Recipe } from "./types";

export interface RawRun {
  run_date: string;
  host: { slug: string; name: string; vendor: string; chip: string; vram_gb?: number | null };
  model: { slug: string; name: string; params_b?: number | null; quantization: string; source_url?: string | null };
  engine: { slug: string; name: string; version?: string; commit?: string; backend?: string; build_flags?: string | null };
  pp?: number | null;
  pp_toks_per_s?: number | null;
  tg?: number | null;
  tg_toks_per_s?: number | null;
  ttft_ms?: number | null;
  tpot_ms?: number | null;
  combined_toks_per_s?: number | null;
  concurrency?: number | null;
  batch?: number | null;
  depth?: number | null;
  scenario?: string;
  seq_test?: string | null;
  command?: string;
  harness?: string;
  image?: string;
  image_requested?: string;
  image_resolved?: string;
  image_digest?: string;
  image_tag?: string;
  image_commit?: string;
  image_id?: string;
  deviceAxis?: Record<string, unknown>;
  modelAxis?: Record<string, unknown>;
  launchAxis?: Record<string, unknown>;
  benchmarkAxis?: Record<string, unknown>;
  configAxis?: Record<string, unknown>;
  notes?: string;
  id?: string;
}

export interface RawFile {
  source: string;
  generated_at: string;
  runs: RawRun[];
}

export function publisherOf(modelName: string): string {
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

function gpuLabel(host: RawRun["host"]): string {
  const chip = host.chip || host.name;
  if (/strix\s*halo/i.test(chip) || /8060s/i.test(chip)) return "Radeon 8060S (Strix Halo)";
  if (/r9700/i.test(chip) || /r9700/i.test(host.name)) return "Radeon AI PRO R9700";
  return host.name;
}

function num(v: number | null | undefined): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function hashId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `is${h.toString(36)}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function benchmarksFromRawRuns(runs: RawRun[]): Benchmark[] {
  const groups = new Map<string, RawRun[]>();
  for (const r of runs) {
    const launchId = [r.launchAxis?.id, r.image_resolved, r.image_digest, r.image, r.command].filter(Boolean).join("|") || "launch";
    const benchmarkId = String(r.benchmarkAxis?.id ?? r.benchmarkAxis?.profile ?? r.scenario ?? "benchmark");
    const key = [r.host.slug, r.model.slug, r.engine.slug, r.engine.backend, r.model.quantization, launchId, benchmarkId].join("|");
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }

  const out: Benchmark[] = [];
  for (const [key, group] of groups) {
    const sample = group[0];
    const publisher = publisherOf(sample.model.name);
    const gpu = gpuLabel(sample.host);
    const backend = sample.engine.backend || "";
    const runtime = sample.engine.name;
    const quant = sample.model.quantization;
    const id = hashId(key);

    const tests: BenchTest[] = [];
    let latestDate = sample.run_date;
    const byTest = new Map<string, RawRun>();
    for (const r of group) {
      const c = r.concurrency ?? r.batch ?? 1;
      const tkey = `${c}|${r.depth ?? 0}|${r.pp ?? ""}|${r.tg ?? ""}|${r.seq_test ?? ""}`;
      const prev = byTest.get(tkey);
      if (!prev || r.run_date >= prev.run_date) byTest.set(tkey, r);
      if (r.run_date > latestDate) latestDate = r.run_date;
    }
    const sortedKeys = [...byTest.keys()].sort((a, b) => {
      const [ca, sa] = a.split("|");
      const [cb, sb] = b.split("|");
      return Number(ca) - Number(cb) || sa.localeCompare(sb);
    });

    for (const tkey of sortedKeys) {
      const r = byTest.get(tkey)!;
      const c = r.concurrency ?? r.batch ?? 1;
      const depth = r.depth && r.depth > 0 ? ` @ d${r.depth}` : "";
      const seq = r.seq_test ? ` ${r.seq_test}` : "";
      const ppSize = r.pp ?? 512;
      const tgSize = r.tg ?? 128;
      const pp = num(r.pp_toks_per_s);
      const tg = num(r.tg_toks_per_s);
      const ttft = num(r.ttft_ms);
      if (pp !== undefined) tests.push({ testName: `pp${ppSize}${depth} (c${c})${seq}`, tokensPerSec: round(pp), e2eTtft: ttft, ttfr: ttft });
      if (tg !== undefined) {
        tests.push({
          testName: `tg${tgSize}${depth} (c${c})${seq}`,
          tokensPerSec: round(tg),
          e2eTtft: ttft,
          ttfr: ttft,
          tpotMs: num(r.tpot_ms),
        });
      }
    }
    if (tests.length === 0) continue;

    const decodeC1 = tests.find((t) => t.testName === "tg128 (c1)")?.tokensPerSec ?? tests.find((t) => t.testName.startsWith("tg128 (c1)"))?.tokensPerSec ?? 0;
    const prefillC1 = tests.find((t) => t.testName === "pp512 (c1)")?.tokensPerSec ?? tests.find((t) => t.testName.startsWith("pp512 (c1)"))?.tokensPerSec ?? 0;

    const provenance = sample.host.slug === "amd-rocm-regression"
      ? "Measured by the AMD ROCm Strix Halo regression suite (decode throughput)."
      : "Measured by RadeonArena (in512/out128 streaming benchmark).";

    const recipe: Recipe = {
      name: `${sample.model.name} · ${runtime}${backend ? ` (${backend})` : ""} · ${quant}`,
      version: 1,
      command: sample.command || "",
      container: sample.image || (sample.image_tag ? `radeon-arena/${sample.engine.slug}:${sample.image_tag}` : undefined),
      model: sample.model.source_url || undefined,
      description: `${runtime}${backend ? ` / ${backend}` : ""} serving of ${sample.model.name} (${quant}) on ${gpu}. ${provenance}`,
      fullRecipe: {
        config: sample.configAxis ?? {},
        device: sample.deviceAxis ?? {
          gpu,
          clusterSize: 1,
        },
        model: sample.modelAxis ?? {
          name: sample.model.name,
          source: sample.model.source_url,
          quantization: quant,
        },
        launch: sample.launchAxis ?? {
          runtime,
          backend,
          image: sample.image,
          image_tag: sample.image_tag,
          image_commit: sample.image_commit,
          image_id: sample.image_id,
          command: sample.command,
          build_flags: sample.engine.build_flags || undefined,
        },
        benchmark: sample.benchmarkAxis ?? {
          profile: sample.scenario,
          pp: sample.pp,
          tg: sample.tg,
          concurrency: [...new Set(group.map((r) => r.concurrency ?? r.batch ?? 1))].sort((a, b) => Number(a) - Number(b)),
        },
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
      benchmarkType: "radeon-arena",
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
      dataSource: "RadeonArena",
      verificationStatus: "self",
    } as Benchmark);
  }

  out.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return out;
}
