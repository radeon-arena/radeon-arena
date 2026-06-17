// Generate a sample leaderboard snapshot from the real InferStation RDNA dataset.
// Usage: pnpm snapshot   (writes snapshot.sample.json + carousel.sample.json)
import { writeFileSync } from "node:fs";
import { loadInferStationBenchmarks } from "../src/lib/inferstationData";
import { buildSnapshot, buildCarousel } from "../src/lib/aggregate";

const benchmarks = loadInferStationBenchmarks();
const snapshot = buildSnapshot(benchmarks);
const carousel = buildCarousel(benchmarks);

writeFileSync("snapshot.sample.json", JSON.stringify(snapshot, null, 2));
writeFileSync("carousel.sample.json", JSON.stringify(carousel, null, 2));

console.log("Seed benchmarks:", benchmarks.length);
console.log("Tests:", snapshot.metadata.testCount);
console.log("Snapshot entries:", snapshot.metadata.totalEntries);
console.log("Wrote snapshot.sample.json + carousel.sample.json");
