"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaderboardSnapshot, SnapshotEntry } from "@/lib/types";
import { fmtTps, fmtMs, fmtDate, rankBadge } from "@/lib/format";

const FAMILIES: { key: string; label: string }[] = [
  { key: "tg", label: "Decode (tg)" },
  { key: "pp", label: "Prefill (pp)" },
  { key: "ctx_tg", label: "Long-ctx decode" },
  { key: "ctx_pp", label: "Long-ctx prefill" },
];

function familyOf(test: string): string {
  if (test.startsWith("ctx_pp")) return "ctx_pp";
  if (test.startsWith("ctx_tg")) return "ctx_tg";
  if (test.startsWith("pp")) return "pp";
  if (test.startsWith("tg")) return "tg";
  return "other";
}

export function LeaderboardView() {
  const [snap, setSnap] = useState<LeaderboardSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [family, setFamily] = useState("tg");
  const [test, setTest] = useState<string>("");
  const [cluster, setCluster] = useState<number | "all">("all");

  useEffect(() => {
    fetch("/static/snapshot", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: LeaderboardSnapshot) => setSnap(d))
      .catch(() => setError(true));
  }, []);

  const testsInFamily = useMemo(
    () => (snap ? snap.availableTests.filter((t) => familyOf(t) === family) : []),
    [snap, family],
  );

  useEffect(() => {
    if (testsInFamily.length && !testsInFamily.includes(test)) {
      const preferred = testsInFamily.find((t) => t.includes("(c1)")) ?? testsInFamily[0];
      setTest(preferred);
    }
  }, [testsInFamily, test]);

  const rows: SnapshotEntry[] = useMemo(() => {
    if (!snap || !test) return [];
    const list = snap.entriesByTest[test] ?? [];
    return cluster === "all" ? list : list.filter((e) => e.clusterSize === cluster);
  }, [snap, test, cluster]);

  const clusterOptions = useMemo(() => {
    if (!snap || !test) return [];
    const set = new Set((snap.entriesByTest[test] ?? []).map((e) => e.clusterSize));
    return [...set].sort((a, b) => a - b);
  }, [snap, test]);

  if (error) return <p className="py-12 text-center text-zinc-500">Failed to load leaderboard snapshot.</p>;
  if (!snap) return <p className="py-12 text-center text-zinc-500">Loading leaderboard snapshot…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FAMILIES.map((f) => (
          <button
            key={f.key}
            onClick={() => setFamily(f.key)}
            className={`chip ${family === f.key ? "border-radeon-600 text-radeon-300" : ""}`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={test}
          onChange={(e) => setTest(e.target.value)}
          className="ml-auto rounded-lg border border-ink-600 bg-ink-850 px-3 py-1.5 text-sm text-zinc-200"
        >
          {testsInFamily.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {clusterOptions.length > 1 && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Cluster:</span>
          <button onClick={() => setCluster("all")} className={`chip ${cluster === "all" ? "border-radeon-600 text-radeon-300" : ""}`}>all</button>
          {clusterOptions.map((c) => (
            <button key={c} onClick={() => setCluster(c)} className={`chip ${cluster === c ? "border-radeon-600 text-radeon-300" : ""}`}>
              c{c}
            </button>
          ))}
        </div>
      )}

      <div className="card thin-scroll overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Runtime</th>
              <th className="px-4 py-3">Quant</th>
              <th className="px-4 py-3">GPU</th>
              <th className="px-4 py-3 text-right">tok/s</th>
              <th className="px-4 py-3 text-right">TTFT</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Recipe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rows.map((e) => (
              <tr key={`${e.benchmarkId}-${e.rank}`} className="hover:bg-ink-850/60">
                <td className={`px-4 py-2.5 font-mono ${rankBadge(e.rank)}`}>{e.rank}</td>
                <td className="px-4 py-2.5">
                  <a href={e.modelUrl} className="text-zinc-200 hover:text-radeon-400">{e.modelName}</a>
                </td>
                <td className="px-4 py-2.5 text-zinc-400">{e.runtime}</td>
                <td className="px-4 py-2.5"><span className="chip">{e.quantization}</span></td>
                <td className="px-4 py-2.5 text-zinc-400">{e.gpu}{e.clusterSize > 1 ? ` ×${e.clusterSize}` : ""}</td>
                <td className="px-4 py-2.5 text-right font-mono text-radeon-300">{fmtTps(e.tokensPerSec)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{fmtMs(e.e2eTtft)}</td>
                <td className="px-4 py-2.5 text-zinc-500">{fmtDate(e.submittedAt)}</td>
                <td className="px-4 py-2.5">
                  <a href={`/api/recipes/${e.benchmarkId}/raw`} className="text-xs text-radeon-400 hover:text-radeon-300">YAML</a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-600">No entries for this test.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        {snap.metadata.totalEntries.toLocaleString()} entries across {snap.metadata.testCount} tests · snapshot {fmtDate(snap.generatedAt)} · refresh every {snap.metadata.snapshotIntervalHours}h
      </p>
    </div>
  );
}
