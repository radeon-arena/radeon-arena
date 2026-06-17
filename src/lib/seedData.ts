import type {
  Benchmark,
  BenchTest,
  Creator,
  Quantization,
  Recipe,
  RecipeType,
  Runtime,
} from "./types";
import { bytesPerParam } from "./modelMeta";

// ── Deterministic PRNG so the seed dataset (and therefore the snapshot) is
//    byte-stable across rebuilds. ──────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── AMD Radeon / Instinct hardware tracked by the arena. ─────────────────────
interface Gpu {
  name: string;
  vramGb: number;
  memBwGBs: number; // memory bandwidth, GB/s
}
const GPUS: Gpu[] = [
  { name: "Radeon AI PRO R9700", vramGb: 32, memBwGBs: 640 },
  { name: "Radeon PRO W7900", vramGb: 48, memBwGBs: 864 },
  { name: "Radeon PRO W7800", vramGb: 32, memBwGBs: 700 },
  { name: "Radeon RX 7900 XTX", vramGb: 24, memBwGBs: 960 },
  { name: "Instinct MI300X", vramGb: 192, memBwGBs: 5300 },
];

interface ModelSpec {
  name: string;
  path: string;
  totalB: number;
  activeB: number; // active params per token (== totalB for dense)
  quants: Quantization[];
}

// Real open-weight models commonly run on ROCm, with realistic param counts.
const MODELS: ModelSpec[] = [
  { name: "Qwen3-32B", path: "Qwen/Qwen3-32B", totalB: 32, activeB: 32, quants: ["BF16", "FP8", "AWQ", "GPTQ"] },
  { name: "Qwen3-30B-A3B", path: "Qwen/Qwen3-30B-A3B", totalB: 30, activeB: 3, quants: ["BF16", "FP8", "MXFP4", "AWQ"] },
  { name: "Qwen3-14B", path: "Qwen/Qwen3-14B", totalB: 14, activeB: 14, quants: ["BF16", "FP8", "AWQ"] },
  { name: "Qwen3-8B", path: "Qwen/Qwen3-8B", totalB: 8, activeB: 8, quants: ["BF16", "FP8", "AWQ", "GPTQ"] },
  { name: "Qwen3-4B", path: "Qwen/Qwen3-4B", totalB: 4, activeB: 4, quants: ["BF16", "FP8"] },
  { name: "Qwen2.5-Coder-7B", path: "Qwen/Qwen2.5-Coder-7B-Instruct", totalB: 7, activeB: 7, quants: ["BF16", "FP8", "AWQ"] },
  { name: "Llama-3.3-70B-Instruct", path: "meta-llama/Llama-3.3-70B-Instruct", totalB: 70, activeB: 70, quants: ["FP8", "AWQ", "GPTQ", "Q4_K_M"] },
  { name: "Llama-3.1-8B-Instruct", path: "meta-llama/Llama-3.1-8B-Instruct", totalB: 8, activeB: 8, quants: ["BF16", "FP8", "AWQ"] },
  { name: "Llama-3.2-3B", path: "meta-llama/Llama-3.2-3B-Instruct", totalB: 3, activeB: 3, quants: ["BF16", "FP8"] },
  { name: "gemma-3-27b-it", path: "google/gemma-3-27b-it", totalB: 27, activeB: 27, quants: ["BF16", "FP8", "AWQ"] },
  { name: "gemma-3-12b-it", path: "google/gemma-3-12b-it", totalB: 12, activeB: 12, quants: ["BF16", "FP8"] },
  { name: "gemma-3-4b-it", path: "google/gemma-3-4b-it", totalB: 4, activeB: 4, quants: ["BF16", "FP8"] },
  { name: "Mistral-Small-3.2-24B", path: "mistralai/Mistral-Small-3.2-24B-Instruct-2506", totalB: 24, activeB: 24, quants: ["BF16", "FP8", "AWQ"] },
  { name: "Mixtral-8x7B", path: "mistralai/Mixtral-8x7B-Instruct-v0.1", totalB: 47, activeB: 13, quants: ["FP8", "AWQ", "GPTQ"] },
  { name: "DeepSeek-R1-Distill-Qwen-32B", path: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", totalB: 32, activeB: 32, quants: ["BF16", "FP8", "AWQ"] },
  { name: "DeepSeek-V2-Lite", path: "deepseek-ai/DeepSeek-V2-Lite", totalB: 16, activeB: 2.4, quants: ["BF16", "FP8"] },
  { name: "Phi-4", path: "microsoft/phi-4", totalB: 14, activeB: 14, quants: ["BF16", "FP8", "AWQ"] },
  { name: "gpt-oss-20b", path: "openai/gpt-oss-20b", totalB: 20, activeB: 3.6, quants: ["MXFP4", "BF16"] },
  { name: "gpt-oss-120b", path: "openai/gpt-oss-120b", totalB: 120, activeB: 5.1, quants: ["MXFP4"] },
  { name: "LFM2-1.2B", path: "LiquidAI/LFM2-1.2B", totalB: 1.2, activeB: 1.2, quants: ["BF16"] },
];

interface Contributor extends Creator {
  userId: string;
  githubId: number;
}
// Fictional community contributors — no real personal data.
const CONTRIBUTORS: Contributor[] = [
  mk("u_alexchen", "Alex Chen", 101),
  mk("u_marcusfeld", "Marcus Feld", 202),
  mk("u_priyanair", "Priya Nair", 303),
  mk("u_tnovak", "Tomáš Novák", 404),
  mk("u_srossi", "Sofia Rossi", 505),
  mk("u_kwatanabe", "Kenji Watanabe", 606),
  mk("u_liangwei", "Liang Wei", 707),
  mk("u_ohaddad", "Omar Haddad", 808),
  mk("u_glindqvist", "Greta Lindqvist", 909),
  mk("u_dmarin", "Diego Marín", 110),
  mk("u_hanakim", "Hana Kim", 121),
  mk("u_swhitfield", "Sam Whitfield", 132),
];

function mk(userId: string, name: string, githubId: number): Contributor {
  const handle = userId.replace(/^u_/, "");
  return {
    userId,
    name,
    githubId,
    avatar: `https://avatars.githubusercontent.com/u/${githubId}?v=4`,
    githubProfile: `https://github.com/${handle}`,
    forumProfile: `https://community.amd.com/t5/user/viewprofilepage/user-id/${githubId}`,
    linkedinProfile: `https://www.linkedin.com/in/${handle}/`,
  };
}

const RUNTIMES: Runtime[] = ["vLLM", "SGLang", "llama.cpp", "MLC-LLM"];

// ── Synthetic but physically-grounded performance model. ─────────────────────
function decodeTps(gpu: Gpu, activeB: number, q: Quantization, runtime: Runtime, rng: () => number) {
  const bpp = bytesPerParam(q);
  // Memory-bound decode: bytes moved per token ≈ activeParams * bytesPerParam.
  let base = (gpu.memBwGBs / (activeB * bpp)) * 0.62;
  // MoE routing overhead.
  if (activeB < 6) base *= 0.55;
  // Runtime efficiency multipliers.
  const rtMul: Record<Runtime, number> = { vLLM: 1.0, SGLang: 0.97, "llama.cpp": 0.82, "MLC-LLM": 0.9, "vLLM-Ray": 0.95 };
  base *= rtMul[runtime];
  // ±8% noise.
  base *= 0.92 + rng() * 0.16;
  return Math.max(3, base);
}

function prefillTps(decode: number, gpu: Gpu, rng: () => number) {
  const ratio = 160 + rng() * 180; // compute-bound prefill is ~160-340x decode
  return decode * ratio * (gpu.memBwGBs > 2000 ? 1.4 : 1);
}

function buildTests(gpu: Gpu, activeB: number, q: Quantization, runtime: Runtime, cluster: number, rng: () => number): BenchTest[] {
  const tests: BenchTest[] = [];
  const dTps = decodeTps(gpu, activeB, q, runtime, rng) * (1 + (cluster - 1) * 0.12);
  const pTps = prefillTps(dTps, gpu, rng) * cluster;
  const concur = [1, 2, 4].filter((c) => c <= Math.max(2, cluster * 2));

  for (const c of concur) {
    const cScaleDecode = 1 + Math.log2(c) * 0.35; // aggregate throughput grows sub-linearly
    const cScalePrefill = 1 + Math.log2(c) * 0.6;
    const ttft = (1000 / (pTps / 2048)) * (0.8 + rng() * 0.4);
    pushTest(tests, `pp512 (c${c})`, pTps * cScalePrefill * 0.9, ttft * 0.4, rng);
    pushTest(tests, `pp2048 (c${c})`, pTps * cScalePrefill, ttft, rng);
    pushTest(tests, `tg128 (c${c})`, dTps * cScaleDecode, ttft, rng);
    pushTest(tests, `tg256 (c${c})`, dTps * cScaleDecode * 0.97, ttft, rng);
  }
  // One long-context data point.
  const d = 16384;
  pushTest(tests, `ctx_pp @ d${d} (c1)`, pTps * 0.55, 1000 + rng() * 800, rng);
  pushTest(tests, `ctx_tg @ d${d} (c1)`, dTps * 0.7, 1000 + rng() * 800, rng);
  return tests;
}

function pushTest(arr: BenchTest[], testName: string, tps: number, ttft: number, rng: () => number) {
  const sd = tps * (0.03 + rng() * 0.05);
  arr.push({
    testName,
    tokensPerSec: round(tps),
    tokensPerSecStdDev: round(sd),
    ttfr: round(ttft),
    ttfrStdDev: round(ttft * 0.1),
    e2eTtft: round(ttft),
    e2eTtftStdDev: round(ttft * 0.1),
    estPpt: round(ttft * 0.95),
    estPptStdDev: round(ttft * 0.08),
  });
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function recipeFor(model: ModelSpec, q: Quantization, runtime: Runtime, gpu: Gpu, cluster: number): { recipe: Recipe; recipeType: RecipeType } {
  let command: string;
  let container: string;
  if (runtime === "llama.cpp") {
    container = "ghcr.io/radeon-arena/rocm-llamacpp:latest";
    command = `llama-server \\\n  -m ${model.name}-${q}.gguf \\\n  -ngl 999 \\\n  -c {max_model_len} \\\n  --host {host} --port {port}`;
  } else if (runtime === "SGLang") {
    container = "ghcr.io/radeon-arena/rocm-sglang:latest";
    command = `python -m sglang.launch_server \\\n  --model-path ${model.path} \\\n  --quantization ${q.toLowerCase()} \\\n  --tp ${cluster} \\\n  --host {host} --port {port}`;
  } else {
    container = "ghcr.io/radeon-arena/rocm-vllm:latest";
    command = `vllm serve ${model.path} \\\n  --quantization ${q.toLowerCase()} \\\n  --tensor-parallel-size ${cluster} \\\n  --max-model-len {max_model_len} \\\n  --gpu-memory-utilization 0.9 \\\n  --host {host} --port {port}`;
  }
  const recipeType: RecipeType = runtime === "llama.cpp" ? "radeonrun" : "rocm-vllm-docker";
  return {
    recipe: {
      name: `${model.name} · ${runtime} · ${q}`,
      version: 1,
      command,
      container,
      model: model.path,
      description: `${runtime} serving of ${model.name} (${q}) on ${gpu.name}${cluster > 1 ? ` across ${cluster} GPUs` : ""}.`,
      clusterOnly: cluster > 1,
      fullRecipe: {
        runtime,
        container,
        gpu: gpu.name,
        clusterSize: cluster,
        env: { HSA_OVERRIDE_GFX_VERSION: "11.0.0", VLLM_USE_TRITON_FLASH_ATTN: "1" },
        command,
      },
    },
    recipeType,
  };
}

let cachedSeed: Benchmark[] | null = null;

/** Generate the deterministic seed dataset of benchmark submissions. */
export function generateSeedBenchmarks(): Benchmark[] {
  if (cachedSeed) return cachedSeed;
  const rng = mulberry32(0x52414445); // "RADE"
  const out: Benchmark[] = [];
  let n = 0;

  for (const contributor of CONTRIBUTORS) {
    const submissionCount = 8 + Math.floor(rng() * 8); // 8-15 each
    for (let i = 0; i < submissionCount; i++) {
      const model = MODELS[Math.floor(rng() * MODELS.length)];
      const q = model.quants[Math.floor(rng() * model.quants.length)];
      // Pick a GPU that can plausibly hold the weights.
      const footprint = model.totalB * bytesPerParam(q) * 1.2;
      const candidates = GPUS.filter((g) => g.vramGb >= footprint / Math.max(1, 1));
      const usable = candidates.length ? candidates : [GPUS[GPUS.length - 1]];
      const gpu = usable[Math.floor(rng() * usable.length)];
      const maxCluster = Math.max(1, Math.ceil(footprint / gpu.vramGb));
      const clusterChoices = [1, 1, 1, 2, 2, 4].filter((c) => c >= maxCluster || c === maxCluster);
      const cluster = (clusterChoices.length ? clusterChoices : [maxCluster])[Math.floor(rng() * (clusterChoices.length || 1))] || 1;
      const runtime = RUNTIMES[Math.floor(rng() * RUNTIMES.length)];
      const tests = buildTests(gpu, model.activeB, q, runtime, cluster, rng);
      const { recipe, recipeType } = recipeFor(model, q, runtime, gpu, cluster);

      const daysAgo = Math.floor(rng() * 120);
      const submittedAt = new Date(Date.now() - daysAgo * 86400_000 - Math.floor(rng() * 86400_000)).toISOString();
      const id = `sub${(1_700_000_000_000 + n * 997).toString()}`;
      const approved = rng() > 0.35;
      const decode = tests.find((t) => t.testName === "tg128 (c1)")?.tokensPerSec ?? 0;
      const prefill = tests.find((t) => t.testName === "pp2048 (c1)")?.tokensPerSec ?? 0;

      out.push({
        id,
        benchmarkId: id,
        submissionId: id,
        userId: contributor.userId,
        creator: contributor,
        modelName: model.name,
        modelFullPath: model.path,
        modelHuggingFaceUrl: `https://huggingface.co/${model.path}`,
        runtime,
        quantization: q,
        clusterSize: cluster,
        gpu: gpu.name,
        benchmarkType: "llama-benchy",
        recipeType,
        recipe,
        recipeApproved: approved,
        recipeApprovedAt: approved ? submittedAt : undefined,
        recipeApprovedBy: approved ? "maintainer" : undefined,
        recipePermalinkId: approved ? `rcp-${id}` : undefined,
        recipeCopyCount: approved ? Math.floor(rng() * 40) : 0,
        tests,
        promptProcessingSpeed: prefill,
        aggregateScore: round(decode * 100 + prefill / 10),
        shareCounts: { text: Math.floor(rng() * 10), reddit: Math.floor(rng() * 3) },
        totalShares: Math.floor(rng() * 12),
        submittedAt,
        processedAt: submittedAt,
      });
      n++;
    }
  }
  cachedSeed = out;
  return out;
}
