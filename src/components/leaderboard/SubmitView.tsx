"use client";

import { useState } from "react";
import { getToken, setToken, getAuthor, setAuthor, authHeaders } from "@/lib/clientAuth";

interface TestRow {
  testName: string;
  tokensPerSec: string;
}

const field =
  "w-full rounded-lg border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600";
const lbl = "mb-1 block text-xs font-medium text-zinc-500";

export function SubmitView({ hw }: { hw: string }) {
  void hw;
  const [signedIn, setSignedIn] = useState<boolean>(!!getToken());
  const [tokenInput, setTokenInput] = useState("");
  const [author, setAuthorState] = useState(getAuthor() ?? "");

  const [modelName, setModelName] = useState("");
  const [modelFullPath, setModelFullPath] = useState("");
  const [hfUrl, setHfUrl] = useState("");
  const [runtime, setRuntime] = useState("vLLM");
  const [backend, setBackend] = useState("");
  const [quantization, setQuantization] = useState("");
  const [gpu, setGpu] = useState("");
  const [clusterSize, setClusterSize] = useState("1");
  const [command, setCommand] = useState("");
  const [dockerImage, setDockerImage] = useState("");
  const [frameworkVersion, setFrameworkVersion] = useState("");
  const [frameworkCommit, setFrameworkCommit] = useState("");
  const [buildFlags, setBuildFlags] = useState("");
  const [benchCommand, setBenchCommand] = useState("");
  const [tests, setTests] = useState<TestRow[]>([{ testName: "tg128 (c1)", tokensPerSec: "" }]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function signIn() {
    if (!tokenInput.trim()) return;
    setToken(tokenInput.trim());
    if (author.trim()) setAuthor(author.trim());
    setSignedIn(true);
  }

  function setTest(i: number, key: keyof TestRow, val: string) {
    setTests((ts) => ts.map((t, idx) => (idx === i ? { ...t, [key]: val } : t)));
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    setOk(false);
    if (author.trim()) setAuthor(author.trim());

    if (!modelName || !modelFullPath || !runtime || !quantization || !gpu) {
      setMsg("Please fill model, runtime, quantization and GPU.");
      setBusy(false);
      return;
    }
    const validTests = tests
      .filter((t) => t.testName.trim() && t.tokensPerSec.trim() && Number.isFinite(Number(t.tokensPerSec)))
      .map((t) => ({ testName: t.testName.trim(), tokensPerSec: Number(t.tokensPerSec) }));
    if (validTests.length === 0) {
      setMsg("Add at least one test result (name + tokens/sec).");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          modelName,
          modelFullPath,
          modelHuggingFaceUrl: hfUrl || undefined,
          runtime,
          backend: backend || undefined,
          quantization,
          gpu,
          clusterSize: Number(clusterSize) || 1,
          serveCommand: command.trim() || undefined,
          dockerImage: dockerImage.trim() || undefined,
          frameworkVersion: frameworkVersion.trim() || undefined,
          frameworkCommit: frameworkCommit.trim() || undefined,
          buildFlags: buildFlags.trim() || undefined,
          benchCommand: benchCommand.trim() || undefined,
          tests: validTests,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Submit failed");
        return;
      }
      setOk(true);
      setMsg(
        `Submitted (id ${String(data.id).slice(0, 8)}…) — status: pending verification. It shows as ⚠ pending until a runner reruns and verifies it.`,
      );
      setModelName("");
      setModelFullPath("");
      setHfUrl("");
      setTests([{ testName: "tg128 (c1)", tokensPerSec: "" }]);
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md card p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Sign in to submit</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Submitting a result requires a token (the <code className="text-radeon-300">SUBMIT_TOKEN</code> or{" "}
          <code className="text-radeon-300">ADMIN_TOKEN</code> configured on the server).
        </p>
        <label className={`mt-4 ${lbl}`}>Display name (optional)</label>
        <input value={author} onChange={(e) => setAuthorState(e.target.value)} placeholder="Your name" className={field} />
        <label className={`mt-3 ${lbl}`}>Token</label>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && signIn()}
          placeholder="SUBMIT_TOKEN"
          className={field}
        />
        <button onClick={signIn} className="btn-primary mt-4 w-full">
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Submit a benchmark result</h2>
          <button onClick={() => setSignedIn(false)} className="btn-ghost text-xs">
            Switch token
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Your numbers are <span className="text-amber-300">self-reported</span> and enter the board as{" "}
          <span className="text-amber-300">⚠ pending</span> — a runner reruns the recipe to verify before it’s marked ✓.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label className={lbl}>Model name *</label><input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="Qwen3-8B" className={field} /></div>
          <div><label className={lbl}>Model HF path *</label><input value={modelFullPath} onChange={(e) => setModelFullPath(e.target.value)} placeholder="Qwen/Qwen3-8B" className={field} /></div>
          <div><label className={lbl}>Runtime *</label><input value={runtime} onChange={(e) => setRuntime(e.target.value)} placeholder="vLLM / llama.cpp" className={field} /></div>
          <div><label className={lbl}>Backend</label><input value={backend} onChange={(e) => setBackend(e.target.value)} placeholder="ROCm/HIP, Vulkan" className={field} /></div>
          <div><label className={lbl}>Quantization *</label><input value={quantization} onChange={(e) => setQuantization(e.target.value)} placeholder="BF16 / Q4_K_M / FP8" className={field} /></div>
          <div><label className={lbl}>GPU *</label><input value={gpu} onChange={(e) => setGpu(e.target.value)} placeholder="Radeon AI PRO R9700" className={field} /></div>
          <div><label className={lbl}>Cluster size</label><input value={clusterSize} onChange={(e) => setClusterSize(e.target.value)} type="number" min={1} className={field} /></div>
          <div><label className={lbl}>HF URL (optional)</label><input value={hfUrl} onChange={(e) => setHfUrl(e.target.value)} placeholder="https://huggingface.co/…" className={field} /></div>
        </div>

        <label className={`mt-3 ${lbl}`}>Serve command</label>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={3}
          placeholder="vllm serve Qwen/Qwen3-8B --quantization fp8 …"
          className={`${field} font-mono text-xs`}
        />

        <p className="mt-4 mb-2 text-xs font-semibold text-radeon-300">
          Reproduction — 每个数字可复现（docker / 版本 / 编译）
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={lbl}>Docker image</label><input value={dockerImage} onChange={(e) => setDockerImage(e.target.value)} placeholder="ghcr.io/radeon-arena/halo-vllm:abc123" className={field} /></div>
          <div><label className={lbl}>Framework version</label><input value={frameworkVersion} onChange={(e) => setFrameworkVersion(e.target.value)} placeholder="vLLM 0.22.0 / llama.cpp master" className={field} /></div>
          <div><label className={lbl}>Framework commit</label><input value={frameworkCommit} onChange={(e) => setFrameworkCommit(e.target.value)} placeholder="fe7c8b2414" className={field} /></div>
          <div><label className={lbl}>Build flags（编译方法）</label><input value={buildFlags} onChange={(e) => setBuildFlags(e.target.value)} placeholder="-DGGML_HIP=ON (gfx1151)" className={field} /></div>
        </div>
        <label className={`mt-3 ${lbl}`}>Bench command (optional)</label>
        <input value={benchCommand} onChange={(e) => setBenchCommand(e.target.value)} placeholder="run-recipe.py --benchmark …" className={`${field} font-mono text-xs`} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-radeon-300">Results</h3>
          <button onClick={() => setTests([...tests, { testName: "", tokensPerSec: "" }])} className="chip hover:border-radeon-600 hover:text-radeon-300">
            + Add test
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {tests.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input value={t.testName} onChange={(e) => setTest(i, "testName", e.target.value)} placeholder="tg128 (c1)" className={`${field} flex-1`} />
              <input value={t.tokensPerSec} onChange={(e) => setTest(i, "tokensPerSec", e.target.value)} type="number" placeholder="tokens/sec" className={`${field} w-36`} />
              {tests.length > 1 && (
                <button onClick={() => setTests(tests.filter((_, idx) => idx !== i))} className="px-2 text-zinc-500 hover:text-rose-400">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Use the same test names as the board (e.g. <code>tg128 (c1)</code> for single-stream decode).
        </p>
      </div>

      {msg && <p className={`text-sm ${ok ? "text-emerald-400" : "text-amber-400"}`}>{msg}</p>}
      <button onClick={submit} disabled={busy} className="btn-primary w-full disabled:opacity-50">
        {busy ? "Submitting…" : "Submit result"}
      </button>
    </div>
  );
}
