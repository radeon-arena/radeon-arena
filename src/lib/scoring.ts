import type {
  Benchmark,
  ContributionBreakdown,
  OrgLeaderboardEntry,
  UserLeaderboardEntry,
} from "./types";
import { estimateParamsB, estimateVramGb } from "./modelMeta";

// Weights for each scoring dimension. A contributor's score is the sum of all
// five dimensions, each normalized to the strongest contributor on the board
// and scaled by its weight (so the theoretical max score is ~100).
const WEIGHTS = {
  vram: 20,
  modelSize: 20,
  runs: 35,
  uniqueModels: 15,
  tps: 10,
} as const;

interface Aggregate {
  key: string;
  name: string;
  runs: number;
  uniqueModels: Set<string>;
  totalModelParamsB: number;
  totalEstimatedVramGb: number;
  tpsSum: number;
  tpsCount: number;
  sample: Benchmark;
}

function emptyAggregate(key: string, name: string, sample: Benchmark): Aggregate {
  return {
    key,
    name,
    runs: 0,
    uniqueModels: new Set(),
    totalModelParamsB: 0,
    totalEstimatedVramGb: 0,
    tpsSum: 0,
    tpsCount: 0,
    sample,
  };
}

function decodeTps(b: Benchmark): number {
  const t =
    b.tests.find((x) => x.testName === "tg128 (c1)") ??
    b.tests.find((x) => x.testName.startsWith("tg128")) ??
    b.tests.find((x) => x.testName.startsWith("tg"));
  return t?.tokensPerSec ?? 0;
}

function accumulate(agg: Aggregate, b: Benchmark) {
  agg.runs += 1;
  agg.uniqueModels.add(b.modelFullPath);
  agg.totalModelParamsB += estimateParamsB(b.modelName, b.modelFullPath);
  agg.totalEstimatedVramGb += estimateVramGb(b.modelName, b.quantization);
  const tps = decodeTps(b);
  if (tps > 0) {
    agg.tpsSum += tps;
    agg.tpsCount += 1;
  }
}

function buildContribution(
  agg: Aggregate,
  maxes: { vram: number; modelSize: number; runs: number; uniqueModels: number; tps: number },
): { contributions: ContributionBreakdown; score: number; avgTps: number } {
  const avgTps = agg.tpsCount ? agg.tpsSum / agg.tpsCount : 0;
  const safe = (v: number, m: number) => (m > 0 ? v / m : 0);
  const contributions: ContributionBreakdown = {
    vram: round(safe(agg.totalEstimatedVramGb, maxes.vram) * WEIGHTS.vram),
    modelSize: round(safe(agg.totalModelParamsB, maxes.modelSize) * WEIGHTS.modelSize),
    runs: round(safe(agg.runs, maxes.runs) * WEIGHTS.runs),
    uniqueModels: round(safe(agg.uniqueModels.size, maxes.uniqueModels) * WEIGHTS.uniqueModels),
    tps: round(safe(avgTps, maxes.tps) * WEIGHTS.tps),
  };
  const score = round(
    contributions.vram +
      contributions.modelSize +
      contributions.runs +
      contributions.uniqueModels +
      contributions.tps,
  );
  return { contributions, score, avgTps };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function maxesOf(aggs: Aggregate[]) {
  const avg = (a: Aggregate) => (a.tpsCount ? a.tpsSum / a.tpsCount : 0);
  return {
    vram: Math.max(1, ...aggs.map((a) => a.totalEstimatedVramGb)),
    modelSize: Math.max(1, ...aggs.map((a) => a.totalModelParamsB)),
    runs: Math.max(1, ...aggs.map((a) => a.runs)),
    uniqueModels: Math.max(1, ...aggs.map((a) => a.uniqueModels.size)),
    tps: Math.max(1, ...aggs.map(avg)),
  };
}

/** Build the Users leaderboard from raw benchmark submissions. */
export function computeUserLeaderboard(benchmarks: Benchmark[]): UserLeaderboardEntry[] {
  // All benchmarks come from RadeonArena's own measurement fleet, so they roll
  // up into a single "RadeonArena" contributor rather than per-machine rows.
  const CONTRIBUTOR_KEY = "radeon-arena";
  const CONTRIBUTOR_NAME = "RadeonArena";
  const byUser = new Map<string, Aggregate>();
  for (const b of benchmarks) {
    let agg = byUser.get(CONTRIBUTOR_KEY);
    if (!agg) {
      agg = emptyAggregate(CONTRIBUTOR_KEY, CONTRIBUTOR_NAME, b);
      byUser.set(CONTRIBUTOR_KEY, agg);
    }
    accumulate(agg, b);
  }
  const aggs = [...byUser.values()];
  const maxes = maxesOf(aggs);
  const rows = aggs.map((agg) => {
    const { contributions, score, avgTps } = buildContribution(agg, maxes);
    return {
      userId: agg.key,
      displayName: agg.name,
      avatarUrl: agg.sample.creator?.avatar,
      forumProfile: agg.sample.creator?.forumProfile,
      linkedinProfile: agg.sample.creator?.linkedinProfile,
      githubProfile: agg.sample.creator?.githubProfile,
      runs: agg.runs,
      uniqueModels: agg.uniqueModels.size,
      totalModelParamsB: round(agg.totalModelParamsB),
      totalEstimatedVramGb: round(agg.totalEstimatedVramGb),
      avgTokensPerSec: round(avgTps),
      score,
      contributions,
      rank: 0,
    } satisfies UserLeaderboardEntry;
  });
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

/** Organization key is derived from the HF namespace (e.g. "Qwen/..." -> "qwen"). */
export function orgKeyOf(modelFullPath: string): string {
  const ns = modelFullPath.split("/")[0] ?? "unknown";
  return ns.toLowerCase();
}

/** Build the Organizations leaderboard from raw benchmark submissions. */
export function computeOrgLeaderboard(benchmarks: Benchmark[]): OrgLeaderboardEntry[] {
  const byOrg = new Map<string, Aggregate>();
  for (const b of benchmarks) {
    const key = orgKeyOf(b.modelFullPath);
    let agg = byOrg.get(key);
    if (!agg) {
      agg = emptyAggregate(key, b.modelFullPath.split("/")[0] ?? key, b);
      byOrg.set(key, agg);
    }
    accumulate(agg, b);
  }
  const aggs = [...byOrg.values()];
  const maxes = maxesOf(aggs);
  const rows = aggs.map((agg) => {
    const { contributions, score, avgTps } = buildContribution(agg, maxes);
    return {
      organizationKey: agg.key,
      organizationName: agg.name,
      runs: agg.runs,
      uniqueModels: agg.uniqueModels.size,
      totalModelParamsB: round(agg.totalModelParamsB),
      totalEstimatedVramGb: round(agg.totalEstimatedVramGb),
      avgTokensPerSec: round(avgTps),
      score,
      contributions,
      rank: 0,
    } satisfies OrgLeaderboardEntry;
  });
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}
