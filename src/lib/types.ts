// Core domain types for Radeon Arena, modeled after the reverse-engineered
// Spark Arena data shapes but adapted to the AMD Radeon ecosystem.

/**
 * Inference runtime/engine name (e.g. "vLLM", "llama.cpp", "SGLang").
 * Kept as a string because real benchmark data carries many engine variants.
 */
export type Runtime = string;

/**
 * Quantization format. Kept as a string because real data spans both
 * GPU-native formats (BF16/FP8/AWQ) and GGUF formats (Q8_0/UD-Q4_K_M/...).
 */
export type Quantization = string;

/** How the recipe was produced. */
export type RecipeType = "rocm-vllm-docker" | "radeonrun" | "manual";

/** A single benchmark test result within a submission. */
export interface BenchTest {
  testName: string; // e.g. "tg128 (c1)", "pp512 (c1)", "ctx_pp @ d16384 (c2)"
  tokensPerSec: number;
  tokensPerSecStdDev?: number;
  ttfr?: number; // time to first response (ms)
  ttfrStdDev?: number;
  e2eTtft?: number; // end-to-end time to first token (ms)
  e2eTtftStdDev?: number;
  estPpt?: number; // estimated prompt processing time
  estPptStdDev?: number;
  tpotMs?: number; // time per output token (ms)
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

/**
 * Verification state of a benchmark (DESIGN.md §4):
 *   self     — first-party RadeonArena runner result (trusted, not user-reported)
 *   pending  — user-submitted, awaiting a verification rerun
 *   verified — rerun matched the self-reported value within tolerance (✅)
 *   failed   — rerun did not match; KEPT on the board and opened for discussion (⚠️)
 */
export type VerificationStatus = "self" | "pending" | "verified" | "failed";

/** Record of a verification rerun performed by a radeonrun runner (or admin). */
export interface VerificationRecord {
  status: VerificationStatus;
  verifiedAt?: string; // ISO timestamp of the rerun
  runner?: string; // e.g. "radeonrun@halo3" or "manual"
  reportedTps?: number; // user self-reported decode tok/s
  measuredTps?: number; // value measured on the rerun
  deviationPct?: number; // |measured - reported| / reported * 100
  tolerancePct?: number; // pass threshold (default 5%)
  note?: string;
}

/** A community discussion post attached to a benchmark. */
export interface DiscussionPost {
  id: string;
  benchmarkId: string;
  author: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
}

/** A full benchmark submission document. */
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
  backend?: string; // attention/compute backend, e.g. "ROCm/HIP", "Vulkan"
  quantization: Quantization;
  clusterSize: number; // 1, 2, 4, 8 ...
  gpu: string; // e.g. "Radeon PRO W7900", "Radeon AI PRO R9700", "Radeon 8060S (Strix Halo)"
  benchmarkType?: string;
  recipeType: RecipeType;
  recipe?: Recipe;
  recipeApproved?: boolean;
  recipeApprovedAt?: string;
  recipeApprovedBy?: string;
  recipePermalinkId?: string;
  recipeCopyCount?: number;
  tests: BenchTest[];
  tests_count?: number;
  promptProcessingSpeed?: number;
  aggregateScore?: number;
  shareCounts?: Record<string, number>;
  totalShares?: number;
  dataSource?: string; // provenance, e.g. "RadeonArena"
  verificationStatus?: VerificationStatus; // DESIGN §4; defaults to "self"
  selfReported?: boolean; // true when user-submitted (vs first-party runner)
  verification?: VerificationRecord; // rerun record, set once verified/failed
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
  backend?: string;
  quantization: Quantization;
  clusterSize: number;
  gpu: string;
  tokensPerSec: number;
  ttfr?: number;
  estPpt?: number;
  e2eTtft?: number;
  tpotMs?: number;
  recipeType: RecipeType;
  verificationStatus?: VerificationStatus;
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
  backend?: string;
  modelName: string;
  org: string;
  gpu?: string;
  quantization?: string;
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
