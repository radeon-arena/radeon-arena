import { loadBenchmarks } from "../src/lib/benchmarkData";
const benchmarks = loadBenchmarks();
const esc = (s: unknown) => s == null ? "\\N" : String(s).replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
const lines: string[] = [];
for (const b of benchmarks) {
  const cols = [b.id, b.benchmarkId, b.userId, b.modelName, b.modelFullPath, b.runtime, b.backend, b.quantization, b.gpu, b.clusterSize ?? 1, b.dataSource, b.submittedAt, JSON.stringify(b)];
  lines.push(cols.map(esc).join("\t"));
}
process.stdout.write(lines.join("\n") + "\n");
console.error(`exported ${benchmarks.length} rows`);
