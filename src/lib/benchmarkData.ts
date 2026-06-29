// Loads REAL benchmark data (RDNA-only) and maps it to the Radeon Arena
// Benchmark model. Every number here is a measured result — there is no
// synthetic/seed data in this project.
//
// Source: RadeonArena automated benchmarks (in512/out128 streaming).
// Filtered to AMD RDNA devices only (Strix Halo / Radeon 8060S gfx1151,
// Radeon AI PRO R9700 gfx1200). NVIDIA and CDNA/Instinct rows are excluded.
import rawData from "@/data/runs.json";
import { benchmarksFromRawRuns, type RawFile } from "./benchmarkMapping";
import type { Benchmark } from "./types";

const FILE = rawData as RawFile;

let cache: Benchmark[] | null = null;

/** Build the Benchmark[] from the real RadeonArena RDNA dataset. */
export function loadBenchmarks(): Benchmark[] {
  if (cache) return cache;
  cache = benchmarksFromRawRuns(FILE.runs);
  return cache;
}
