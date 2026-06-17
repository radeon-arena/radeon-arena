"use client";

import { useEffect, useMemo, useState } from "react";
import type { Benchmark, LeaderboardSnapshot, SnapshotEntry } from "@/lib/types";
import { calculateMetrics } from "@/lib/metrics";
import { fmtTps, fmtMs } from "@/lib/format";

interface Option {
  id: string;
  label: string;
}

function useBenchmark(id: string | null): Benchmark | null {
  const [b, setB] = useState<Benchmark | null>(null);
  useEffect(() => {
    if (!id) {
      setB(null);
      return;
    }
    fetch(`/api/benchmarks/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setB)
      .catch(() => setB(null));
  }, [id]);
  return b;
}

export function CompareView() {
  const [options, setOptions] = useState<Option[]>([]);
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/static/snapshot", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: LeaderboardSnapshot | null) => {
        if (!d) return;
        const list = (d.entriesByTest["tg128 (c1)"] ?? []) as SnapshotEntry[];
        const opts = list.map((e) => ({
          id: e.benchmarkId,
          label: `${e.modelName} · ${e.runtime} · ${e.quantization} · ${e.gpu}${e.clusterSize > 1 ? ` ×${e.clusterSize}` : ""}`,
        }));
        setOptions(opts);
        if (opts[0]) setAId(opts[0].id);
        if (opts[1]) setBId(opts[1].id);
      })
      .catch(() => undefined);
  }, []);

  const a = useBenchmark(aId);
  const b = useBenchmark(bId);
  const ma = useMemo(() => (a ? calculateMetrics(a, 1) : null), [a]);
  const mb = useMemo(() => (b ? calculateMetrics(b, 1) : null), [b]);

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Picker label="Model A" value={aId} options={options} onChange={setAId} />
        <Picker label="Model B" value={bId} options={options} onChange={setBId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard title={a?.modelName} sub={a ? `${a.runtime} · ${a.quantization} · ${a.gpu}` : ""} m={ma} other={mb} />
        <MetricCard title={b?.modelName} sub={b ? `${b.runtime} · ${b.quantization} · ${b.gpu}` : ""} m={mb} other={ma} />
      </div>
    </div>
  );
}

function Picker({ label, value, options, onChange }: { label: string; value: string | null; options: Option[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-zinc-500">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-sm text-zinc-200"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({
  title,
  sub,
  m,
  other,
}: {
  title?: string;
  sub: string;
  m: ReturnType<typeof calculateMetrics> | null;
  other: ReturnType<typeof calculateMetrics> | null;
}) {
  if (!title || !m) return <div className="card p-6 text-sm text-zinc-600">Select a model…</div>;
  const win = (a: number, b?: number, higher = true) =>
    b === undefined ? "" : (higher ? a >= b : a <= b) ? "text-radeon-300" : "text-zinc-300";
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-zinc-100">{title}</h3>
      <p className="mb-4 text-xs text-zinc-500">{sub}</p>
      <dl className="space-y-3 text-sm">
        <Row k="Decode (tg128 c1)" v={<span className={`font-mono ${win(m.decodeToks, other?.decodeToks)}`}>{fmtTps(m.decodeToks)} tok/s</span>} />
        <Row k="Prefill (pp2048 c1)" v={<span className={`font-mono ${win(m.prefillToks, other?.prefillToks)}`}>{fmtTps(m.prefillToks)} tok/s</span>} />
        <Row k="TTFT" v={<span className={`font-mono ${win(m.ttftMs, other?.ttftMs, false)}`}>{fmtMs(m.ttftMs)}</span>} />
        <Row k="256-tok wall time" v={<span className={`font-mono ${win(m.totalTimeMs, other?.totalTimeMs, false)}`}>{fmtMs(m.totalTimeMs)}</span>} />
      </dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-800 pb-2">
      <dt className="text-zinc-500">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
