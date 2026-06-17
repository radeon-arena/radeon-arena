// Core domain types for Radeon Arena, modeled after the reverse-engineered
// Spark Arena data shapes but adapted to the AMD Radeon ecosystem.

/** Inference runtimes tracked by the leaderboard. */
export type Runtime = "vLLM" | "SGLang" | "llama.cpp" | "MLC-LLM" | "vLLM-Ray";

/** Quantization formats commonly used on ROCm / Radeon. */
export type Quantization =
  | "BF16"
  | "FP16"
  | "FP8"
  | "MXFP4"
  | "AWQ"
  | "GPTQ"
  | "INT4"
  | "INT8"
  | "Q4_K_M"
  | "Q8_0";

/** How the recipe was produced. */
export type RecipeType = "rocm-vllm-docker" | "radeonrun" | "manual";

/** A single llama-benchy test result within a submission. */
export interface BenchTest {
  testName: string; // e.g. "tg128 (c1)", "pp2048 (c1)", "ctx_pp @ d16384 (c2)"
  tokensPerSec: number;
  tokensPerSecStdDev?: number;
  ttfr?: number; // time to first response (ms)
  ttfrStdDev?: number;
  e2eTtft?: number; // end-to-end time to first token (ms)
  e2eTtftStdDev?: number;
  estPpt?: number; // estimated prompt processing time
  estPptStdDev?: number;
}

/** The reproducible recipe captured with each submission. */
export interface Recipe {
  name: string;
  version: number;
  command: string;
  container?: string;
  model?: string;
  description?: string;
  clusterOnly?: boolean;
  fullRecipe?: Record<string, unknown>;
}

export interface Creator {
  name: string;
  avatar?: string;
  forumProfile?: string;
  linkedinProfile?: string;
  githubProfile?: string;
}

/** A full benchmark submission document (Firestore: `benchmarks/{id}`). */
export interface Benchmark {
  id: string;
  benchmarkId: string;
  submissionId: string;
  userId: string;
  creator: Creator;
  modelName: string;
  modelFullPath: string; // HF repo path, e.g. "Qwen/Qwen3-32B"
  modelHuggingFaceUrl?: string;
  runtime: Runtime;
  quantization: Quantization;
  clusterSize: number; // 1, 2, 4, 8 ...
  gpu: string; // e.g. "Radeon PRO W7900", "Radeon AI PRO R9700", "Instinct MI300X"
  benchmarkType?: string;
  recipeType: RecipeType;
  recipe?: Recipe;
  recipeApproved?: boolean;
  recipeApprovedAt?: string;
  recipeApprovedBy?: string;
  recipePermalinkId?: string;
  recipeCopyCount?: number;
  tests: BenchTest[];
  promptProcessingSpeed?: number;
  aggregateScore?: number;
  shareCounts?: Record<string, number>;
  totalShares?: number;
  submittedAt: string;
  processedAt?: string;
}

/** One row inside a per-test leaderboard, as served in the snapshot. */
export interface SnapshotEntry {
  rank: number;
  benchmarkId: string;
  userId: string;
  modelName: string;
  modelFullPath: string;
  modelUrl?: string;
  runtime: Runtime;
  quantization: Quantization;
  clusterSize: number;
  gpu: string;
  tokensPerSec: number;
  ttfr?: number;
  estPpt?: number;
  e2eTtft?: number;
  recipeType: RecipeType;
  submittedAt: string;
}

export interface SnapshotMetadata {
  lastUpdated: string;
  snapshotIntervalHours: number;
  totalEntries: number;
  testCount: number;
  availableTests: string[];
}

/** Shape of GET /static/snapshot */
export interface LeaderboardSnapshot {
  version: number;
  generatedAt: string;
  metadata: SnapshotMetadata;
  availableTests: string[];
  entriesByTest: Record<string, SnapshotEntry[]>;
}

/** Shape of GET /static/carousel */
export interface CarouselItem {
  testName: string;
  runtime: Runtime;
  modelName: string;
  org: string;
  tokensPerSec: number;
  clusterSize: number;
}

/** Breakdown of how a contributor's score was earned. */
export interface ContributionBreakdown {
  vram: number;
  modelSize: number;
  runs: number;
  uniqueModels: number;
  tps: number;
}

/** A row in the Users leaderboard. */
export interface UserLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  forumProfile?: string;
  linkedinProfile?: string;
  githubProfile?: string;
  runs: number;
  uniqueModels: number;
  totalModelParamsB: number;
  totalEstimatedVramGb: number;
  avgTokensPerSec: number;
  score: number;
  contributions: ContributionBreakdown;
}

/** A row in the Organizations leaderboard. */
export interface OrgLeaderboardEntry {
  rank: number;
  organizationKey: string;
  organizationName: string;
  runs: number;
  uniqueModels: number;
  totalModelParamsB: number;
  totalEstimatedVramGb: number;
  avgTokensPerSec: number;
  score: number;
  contributions: ContributionBreakdown;
}
