// Pure aggregation helpers (no server-only imports) so they can be reused by
// both the API routes and the standalone snapshot-generation script.
import type {
  Benchmark,
  CarouselItem,
  LeaderboardSnapshot,
  SnapshotEntry,
} from "./types";
import { orgDisplayName } from "./modelMeta";
import { orgKeyOf } from "./scoring";

export const MAX_ENTRIES_PER_TEST = 100;

export function snapshotIntervalHours(): number {
  const v = parseFloat(process.env.SNAPSHOT_INTERVAL_HOURS ?? "0.5");
  return Number.isFinite(v) && v > 0 ? v : 0.5;
}

function entryFromBenchmark(
  b: Benchmark,
  tokensPerSec: number,
  extra: Partial<SnapshotEntry>,
): SnapshotEntry {
  return {
    rank: 0,
    benchmarkId: b.benchmarkId,
    userId: b.userId,
    modelName: b.modelName,
    modelFullPath: b.modelFullPath,
    modelUrl: b.modelHuggingFaceUrl,
    runtime: b.runtime,
    quantization: b.quantization,
    clusterSize: b.clusterSize,
    gpu: b.gpu,
    tokensPerSec,
    recipeType: b.recipeType,
    submittedAt: b.submittedAt,
    ...extra,
  };
}

/** Aggregate raw submissions into the per-test leaderboard snapshot. */
export function buildSnapshot(benchmarks: Benchmark[]): LeaderboardSnapshot {
  const byTest = new Map<string, SnapshotEntry[]>();
  for (const b of benchmarks) {
    for (const t of b.tests) {
      const list = byTest.get(t.testName) ?? [];
      list.push(
        entryFromBenchmark(b, t.tokensPerSec, {
          ttfr: t.ttfr,
          estPpt: t.estPpt,
          e2eTtft: t.e2eTtft,
        }),
      );
      byTest.set(t.testName, list);
    }
  }

  const entriesByTest: Record<string, SnapshotEntry[]> = {};
  let total = 0;
  for (const [testName, list] of byTest) {
    list.sort((a, b) => b.tokensPerSec - a.tokensPerSec);
    const trimmed = list.slice(0, MAX_ENTRIES_PER_TEST);
    trimmed.forEach((e, i) => (e.rank = i + 1));
    entriesByTest[testName] = trimmed;
    total += trimmed.length;
  }

  const availableTests = Object.keys(entriesByTest).sort();
  const now = new Date().toISOString();
  return {
    version: 1,
    generatedAt: now,
    metadata: {
      lastUpdated: now,
      snapshotIntervalHours: snapshotIntervalHours(),
      totalEntries: total,
      testCount: availableTests.length,
      availableTests,
    },
    availableTests,
    entriesByTest,
  };
}

/** Highlight reel for the homepage carousel. */
export function buildCarousel(
  benchmarks: Benchmark[],
): { generatedAt: string; items: CarouselItem[] } {
  const items: CarouselItem[] = [];
  for (const b of benchmarks) {
    const decode = b.tests.find((t) => t.testName === "tg128 (c1)");
    if (!decode) continue;
    items.push({
      testName: decode.testName,
      runtime: b.runtime,
      modelName: b.modelName,
      org: orgDisplayName(orgKeyOf(b.modelFullPath)),
      tokensPerSec: decode.tokensPerSec,
      clusterSize: b.clusterSize,
    });
  }
  items.sort((a, b) => b.tokensPerSec - a.tokensPerSec);
  return { generatedAt: new Date().toISOString(), items: items.slice(0, 60) };
}
