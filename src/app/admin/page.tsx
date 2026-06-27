"use client";

import { useEffect, useState } from "react";
import { getToken, setToken, clearToken, authHeaders } from "@/lib/clientAuth";
import type { Benchmark } from "@/lib/types";

export default function AdminPage() {
  const [token, setTok] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTok(getToken());
    setReady(true);
  }, []);

  if (!ready) return <Shell><p className="text-sm text-zinc-500">Loading…</p></Shell>;

  if (!token) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-zinc-100">Admin</h1>
        <p className="mt-2 max-w-lg text-sm text-zinc-400">
          Enter the admin token (the <code className="text-radeon-300">ADMIN_TOKEN</code> configured on the
          server) to review submissions and run verification.
        </p>
        <div className="mt-4 flex max-w-md gap-2">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                setToken(input.trim());
                setTok(input.trim());
              }
            }}
            placeholder="ADMIN_TOKEN"
            className="flex-1 rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            onClick={() => {
              if (input.trim()) {
                setToken(input.trim());
                setTok(input.trim());
              }
            }}
            className="btn-primary"
          >
            Sign in
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Admin</h1>
        <button onClick={() => { clearToken(); setTok(null); }} className="btn-ghost">Sign out</button>
      </div>
      <p className="mt-2 text-sm text-zinc-400">Signed in with admin token.</p>

      <PendingPanel />

      <p className="mt-6 text-xs text-zinc-600">
        The admin token is stored locally in your browser and sent as a Bearer token to admin APIs.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">{children}</div>;
}

function decodeTps(b: Benchmark): number {
  const t =
    b.tests?.find((x) => x.testName === "tg128 (c1)") ??
    b.tests?.find((x) => x.testName?.startsWith("tg")) ??
    b.tests?.[0];
  return t?.tokensPerSec ?? 0;
}

function PendingPanel() {
  const [items, setItems] = useState<Benchmark[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [measured, setMeasured] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/pending", { headers: authHeaders(false), cache: "no-store" });
      if (!res.ok) {
        setErr((await res.json()).error ?? "Failed to load");
        setItems([]);
        return;
      }
      const d = await res.json();
      setItems(d.pending ?? []);
    } catch {
      setErr("Network error");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function verify(id: string, opts: { measuredTps?: number; status?: "verified" | "failed" }) {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/verify/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(opts),
      });
      if (!res.ok) {
        setErr((await res.json()).error ?? "Verify failed");
        return;
      }
      setItems((prev) => (prev ? prev.filter((b) => (b.benchmarkId || b.id) !== id) : prev));
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  if (items === null) return <p className="mt-6 text-sm text-zinc-500">Loading pending submissions…</p>;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-radeon-300">Pending submissions ({items.length})</h2>
        <button onClick={load} className="chip">Refresh</button>
      </div>
      {err && <p className="mt-2 text-sm text-amber-400">{err}</p>}
      {items.length === 0 && <p className="mt-3 text-sm text-zinc-500">No pending submissions.</p>}
      <div className="mt-3 space-y-3">
        {items.map((b) => {
          const id = b.benchmarkId || b.id;
          return (
            <div key={id} className="card p-4">
              <div>
                <p className="font-medium text-zinc-100">
                  {b.modelName} <span className="text-xs text-zinc-500">{b.quantization}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  {b.runtime} · {b.gpu} · reported decode {decodeTps(b)} tok/s · {b.creator?.name}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={measured[id] ?? ""}
                  onChange={(e) => setMeasured((m) => ({ ...m, [id]: e.target.value }))}
                  type="number"
                  placeholder="measured tok/s"
                  className="w-36 rounded-lg border border-ink-600 bg-ink-950 px-3 py-1.5 text-sm text-zinc-100"
                />
                <button
                  disabled={busyId === id || !measured[id]}
                  onClick={() => verify(id, { measuredTps: Number(measured[id]) })}
                  className="btn-primary disabled:opacity-50"
                >
                  Verify (auto-judge)
                </button>
                <span className="text-zinc-600">or</span>
                <button disabled={busyId === id} onClick={() => verify(id, { status: "verified" })} className="chip hover:border-emerald-600 hover:text-emerald-300">
                  Mark ✓
                </button>
                <button disabled={busyId === id} onClick={() => verify(id, { status: "failed" })} className="chip hover:border-rose-600 hover:text-rose-300">
                  Mark ⚠
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
