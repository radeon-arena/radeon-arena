import type { Benchmark, BenchTest } from "./types";

export interface ModelMetrics {
  decodeToks: number; // tg128 (c1) tokens/sec
  prefillToks: number; // pp2048 (c1) tokens/sec
  ttftMs: number; // end-to-end time to first token (ms)
  totalTimeMs: number; // synthetic 256-token generation wall time
  concurrency: number;
}

function findTest(tests: BenchTest[], exact: string, prefix: string): BenchTest | undefined {
  return (
    tests.find((t) => t.testName === exact) ??
    tests.find((t) => t.testName.startsWith(prefix))
  );
}

/**
 * Derive comparable headline metrics from a submission's raw test array.
 * `concurrency` selects which "(cN)" variant to read (defaults to 1).
 */
export function calculateMetrics(b: Benchmark, concurrency = 1): ModelMetrics {
  const c = `(c${concurrency})`;
  const decode = findTest(b.tests, `tg128 ${c}`, "tg128");
  // Real data uses pp512; fall back to pp2048 / any prefill test.
  const prefill =
    findTest(b.tests, `pp512 ${c}`, "pp512") ??
    findTest(b.tests, `pp2048 ${c}`, "pp2048") ??
    b.tests.find((t) => t.testName.startsWith("pp"));
  const decodeToks = decode?.tokensPerSec ?? 0;
  const prefillToks = prefill?.tokensPerSec ?? 0;
  const ttftMs = decode?.e2eTtft ?? prefill?.e2eTtft ?? 0;
  // Wall time to stream 256 tokens at the measured decode rate, plus TTFT.
  const totalTimeMs = decodeToks > 0 ? ttftMs + (256 / decodeToks) * 1000 : ttftMs;
  return {
    decodeToks: round(decodeToks),
    prefillToks: round(prefillToks),
    ttftMs: round(ttftMs),
    totalTimeMs: round(totalTimeMs),
    concurrency,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** All distinct concurrency levels present in a submission's tests. */
export function availableConcurrencies(b: Benchmark): number[] {
  const set = new Set<number>();
  for (const t of b.tests) {
    const m = t.testName.match(/\(c(\d+)\)/);
    if (m) set.add(parseInt(m[1], 10));
  }
  return [...set].sort((a, b) => a - b);
}
