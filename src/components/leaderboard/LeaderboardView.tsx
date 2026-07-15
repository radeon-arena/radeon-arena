"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaderboardSnapshot, SnapshotEntry } from "@/lib/types";
import { fmtTps, fmtMs } from "@/lib/format";
import { hwMatches, hwLabel } from "@/lib/hardware";
import { loadGithubData } from "@/lib/githubData";
import { BenchmarkModal } from "./BenchmarkModal";
import { VerificationBadge } from "./VerificationBadge";

// ── Test-name parsing ────────────────────────────────────────────────────────
// Raw names look like "tg128 (c1)", "pp2048 @ d4096 (c5)", "tg128 (c1) in4096".
//   base        = tg128 / pp512        (test family + size)
//   inVar       = @ d4096 / in4096     (optional context/input-length variant)
//   conc        = 1 / 2 / 4 / 16 ...   (concurrency, the (cN) part)
//   typeLabel   = base [· inVar]       (what the "Test Type" dropdown shows)
type ParsedTest = {
  raw: string;
  base: string;
  inVar: string;
  conc: number;
  typeLabel: string;
  family: "tg" | "pp" | "other";
};

function parseTest(raw: string): ParsedTest {
  const concMatch = raw.match(/\(c(\d+)\)/);
  const conc = concMatch ? parseInt(concMatch[1], 10) : 1;
  const depthMatch = raw.match(/@\s*d(\d+)/);
  const inMatch = raw.match(/\b(in\d+)\b/);
  const inVar = depthMatch ? `d${depthMatch[1]}` : inMatch ? inMatch[1] : "";
  const base = raw
    .replace(/\s*\(c\d+\)/, "")
    .replace(/\s*@\s*d\d+/, "")
    .replace(/\s*\bin\d+\b/, "")
    .trim();
  const typeLabel = inVar ? `${base} @ ${inVar}` : base;
  const family = base.startsWith("tg") ? "tg" : base.startsWith("pp") ? "pp" : "other";
  return { raw, base, inVar, conc, typeLabel, family };
}

function typeOrder(a: ParsedTest, b: ParsedTest): number {
  const fam = (f: ParsedTest["family"]) => (f === "tg" ? 0 : f === "pp" ? 1 : 2);
  if (fam(a.family) !== fam(b.family)) return fam(a.family) - fam(b.family);
  if (!!a.inVar !== !!b.inVar) return a.inVar ? 1 : -1;
  const ai = parseInt(a.inVar.replace(/^(in|d)/, "") || "0", 10);
  const bi = parseInt(b.inVar.replace(/^(in|d)/, "") || "0", 10);
  return ai - bi;
}

function runtimePill(rt: string): string {
  const r = rt.toLowerCase();
  if (r.includes("vllm")) return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (r.includes("llama")) return "border-sky-300 bg-sky-50 text-sky-700";
  if (r.includes("sglang")) return "border-violet-300 bg-violet-50 text-violet-700";
  if (r.includes("mlc")) return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-ink-600 bg-ink-800 text-zinc-300";
}

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const PAGE_SIZE = 10;

function paginationRange(page: number, totalPages: number): number[] {
  const maxButtons = 10;
  if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, page - half);
  let end = start + maxButtons - 1;
  if (end > totalPages) {
    end = totalPages;
    start = end - maxButtons + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function LeaderboardView({ hw }: { hw: string }) {
  const [snap, setSnap] = useState<LeaderboardSnapshot | null>(null);
  const [error, setError] = useState(false);

  const [testType, setTestType] = useState<string>("");
  const [conc, setConc] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState("all");
  const [clusterFilter, setClusterFilter] = useState<string>("all");
  const [quantFilter, setQuantFilter] = useState("all");
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"rank" | "tps">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadGithubData()
      .then((d) => setSnap(d.snapshot))
      .catch(() => setError(true));
  }, []);

  const parsed = useMemo(() => (snap ? snap.availableTests.map(parseTest) : []), [snap]);

  const testTypes = useMemo(() => {
    const byLabel = new Map<string, ParsedTest>();
    for (const p of parsed) if (!byLabel.has(p.typeLabel)) byLabel.set(p.typeLabel, p);
    return [...byLabel.values()].sort(typeOrder).map((p) => p.typeLabel);
  }, [parsed]);

  const concsForType = useMemo(
    () =>
      [...new Set(parsed.filter((p) => p.typeLabel === testType).map((p) => p.conc))].sort(
        (a, b) => a - b,
      ),
    [parsed, testType],
  );

  // Default the selection once data lands.
  useEffect(() => {
    if (!testTypes.length) return;
    if (!testTypes.includes(testType)) {
      const preferred = testTypes.find((t) => t.startsWith("tg") && !t.includes("·")) ?? testTypes[0];
      setTestType(preferred);
    }
  }, [testTypes, testType]);

  useEffect(() => {
    if (concsForType.length && !concsForType.includes(conc)) setConc(concsForType[0]);
  }, [concsForType, conc]);

  const rawName = useMemo(
    () => parsed.find((p) => p.typeLabel === testType && p.conc === conc)?.raw ?? "",
    [parsed, testType, conc],
  );

  const family = useMemo(
    () => parsed.find((p) => p.typeLabel === testType)?.family ?? "tg",
    [parsed, testType],
  );

  const list: SnapshotEntry[] = useMemo(
    () => (snap && rawName ? snap.entriesByTest[rawName] ?? [] : []),
    [snap, rawName],
  );

  const runtimeOptions = useMemo(() => [...new Set(list.map((e) => e.runtime))].sort(), [list]);
  const clusterOptions = useMemo(
    () => [...new Set(list.map((e) => e.clusterSize))].sort((a, b) => a - b),
    [list],
  );
  const quantOptions = useMemo(() => [...new Set(list.map((e) => e.quantization))].sort(), [list]);

  const rows = useMemo(() => {
    let r = list.filter((e) => hwMatches(hw, e.gpu));
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((e) => `${e.modelName} ${e.modelFullPath}`.toLowerCase().includes(q));
    if (runtimeFilter !== "all") r = r.filter((e) => e.runtime === runtimeFilter);
    if (clusterFilter !== "all") r = r.filter((e) => String(e.clusterSize) === clusterFilter);
    if (quantFilter !== "all") r = r.filter((e) => e.quantization === quantFilter);
    if (verifyFilter !== "all") r = r.filter((e) => (e.verificationStatus ?? "self") === verifyFilter);
    const sorted = [...r].sort((a, b) => {
      const v = sortKey === "rank" ? a.rank - b.rank : (b.tokensPerSec ?? 0) - (a.tokensPerSec ?? 0);
      return sortDir === "asc" ? v : -v;
    });
    return sorted;
  }, [list, hw, search, runtimeFilter, clusterFilter, quantFilter, verifyFilter, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [rawName, hw, search, runtimeFilter, clusterFilter, quantFilter, verifyFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const showingStart = rows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingEnd = rows.length ? Math.min(page * PAGE_SIZE, rows.length) : 0;
  const pageNumbers = paginationRange(page, totalPages);

  if (error) return <p className="py-12 text-center text-zinc-500">Failed to load leaderboard snapshot.</p>;
  if (!snap) return <p className="py-12 text-center text-zinc-500">Loading leaderboard snapshot…</p>;

  const intervalMin = Math.round((snap.metadata.snapshotIntervalHours ?? 0.5) * 60);

  return (
    <div className="space-y-4">
      {/* Test Type + Concurrency */}
      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Test Type</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2.5 text-sm text-zinc-100"
            >
              {testTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Concurrency</label>
            <select
              value={conc}
              onChange={(e) => setConc(Number(e.target.value))}
              className="w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2.5 text-sm text-zinc-100 sm:w-28"
            >
              {concsForType.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Showing {rows.length} results</p>
      </div>

      {/* Status bar */}
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
          Last updated: <span className="font-medium text-zinc-200">{timeAgo(snap.generatedAt)}</span>
          <span className="text-zinc-600">({fmtDateTime(snap.generatedAt)})</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 9h8M8 13h6" strokeLinecap="round" />
          </svg>
          Showing: <span className="font-medium text-radeon-300">{rows.length}</span> of {list.length} benchmarks
        </span>
        <span>
          Update interval: <span className="font-medium text-zinc-200">Every {intervalMin} minutes</span>
        </span>
      </div>

      {/* Search + filters */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[180px] flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models…"
            className="w-full rounded-lg border border-ink-600 bg-ink-950 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <select value={runtimeFilter} onChange={(e) => setRuntimeFilter(e.target.value)} className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-sm text-zinc-200">
          <option value="all">All Runtimes</option>
          {runtimeOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={clusterFilter} onChange={(e) => setClusterFilter(e.target.value)} className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-sm text-zinc-200">
          <option value="all">All GPU Counts</option>
          {clusterOptions.map((c) => (
            <option key={c} value={String(c)}>{c === 1 ? "1 GPU" : `${c} GPUs`}</option>
          ))}
        </select>
        <select value={quantFilter} onChange={(e) => setQuantFilter(e.target.value)} className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-sm text-zinc-200">
          <option value="all">All Quantizations</option>
          {quantOptions.map((qz) => (
            <option key={qz} value={qz}>{qz}</option>
          ))}
        </select>
        <select value={verifyFilter} onChange={(e) => setVerifyFilter(e.target.value)} className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-sm text-zinc-200">
          <option value="all">All Status</option>
          <option value="verified">✓ Verified</option>
          <option value="self">★ First-party</option>
          <option value="pending">… Pending</option>
          <option value="failed">⚠ Repro-failed</option>
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as "rank" | "tps")} className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-sm text-zinc-200">
          <option value="rank">Rank</option>
          <option value="tps">Tokens/sec</option>
        </select>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          aria-label="Toggle sort direction"
          className="rounded-lg border border-ink-600 bg-ink-850 px-2.5 py-2 text-sm text-zinc-300 hover:bg-ink-800"
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>

      {/* Table */}
      <div className="card thin-scroll overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Runtime</th>
              <th className="px-4 py-3">Quant.</th>
              <th className="px-4 py-3">GPUs</th>
              <th className="px-4 py-3 text-right">Tokens/sec</th>
              <th className="px-4 py-3">{family === "pp" ? "TTFT" : "Type"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {pageRows.map((e) => (
              <tr key={`${e.benchmarkId}-${e.rank}`} className="hover:bg-ink-850/60">
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 font-mono text-zinc-300">
                    {MEDALS[e.rank] ? <span className="text-base">{MEDALS[e.rank]}</span> : null}
                    {e.rank}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(e.benchmarkId)}
                      className="inline-flex items-center gap-1 text-left font-medium text-radeon-300 hover:text-radeon-200 hover:underline"
                    >
                      {e.modelName}
                      <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5h10v10M19 5 5 19" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <VerificationBadge status={e.verificationStatus} />
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${runtimePill(e.runtime)}`}>
                    {e.runtime}
                  </span>
                  {e.backend ? <span className="ml-1 text-xs text-zinc-600">{e.backend}</span> : null}
                </td>
                <td className="px-4 py-2.5 text-zinc-400">{e.quantization}</td>
                <td className="px-4 py-2.5 text-zinc-400">{e.clusterSize === 1 ? "1 GPU" : `${e.clusterSize} GPUs`}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-zinc-100">{fmtTps(e.tokensPerSec)}</td>
                <td className="px-4 py-2.5">
                  {family === "pp" ? (
                    <span className="font-mono text-zinc-400">{fmtMs(e.e2eTtft)}</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-radeon-700/50 bg-radeon-900/30 px-2 py-0.5 text-xs text-radeon-300">
                      Decode
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-600">
                  {!list.some((e) => hwMatches(hw, e.gpu)) ? (
                    <>
                      No benchmarks yet for {hwLabel(hw)}.
                      <span className="block text-xs text-zinc-700">Results will appear here once this GPU is benchmarked.</span>
                    </>
                  ) : (
                    "No entries match these filters."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card flex flex-col gap-3 px-5 py-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing <span className="font-medium text-zinc-200">{showingStart}</span> to{" "}
          <span className="font-medium text-zinc-200">{showingEnd}</span> of{" "}
          <span className="font-medium text-zinc-200">{rows.length}</span> entries
        </span>
        <div className="flex items-center gap-1 self-end sm:self-auto" aria-label="Leaderboard pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-ink-700 text-zinc-400 transition-colors hover:border-radeon-700 hover:text-radeon-300 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink-700 disabled:hover:text-zinc-400"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium transition-colors ${
                p === page
                  ? "bg-radeon-500 text-ink-950"
                  : "text-zinc-400 hover:bg-ink-800 hover:text-zinc-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-ink-700 text-zinc-400 transition-colors hover:border-radeon-700 hover:text-radeon-300 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink-700 disabled:hover:text-zinc-400"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        {snap.metadata.totalEntries.toLocaleString()} entries across {snap.metadata.testCount} tests
        <span className="ml-1 text-zinc-500">· data: real RadeonArena benchmarks (AMD RDNA only)</span>
      </p>

      {openId && <BenchmarkModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
