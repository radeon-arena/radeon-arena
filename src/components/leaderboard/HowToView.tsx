import { PROJECTS } from "@/lib/site";

export function HowToView() {
  return (
    <div className="card p-7 text-sm leading-relaxed text-zinc-300">
      <h2 className="text-lg font-semibold text-zinc-100">How to Benchmark</h2>
      <p className="mt-2 text-zinc-400">
        Radeon Arena results come from real <code className="text-radeon-300">llama-benchy</code> runs on AMD Radeon
        hardware. Reproduce a run in three steps:
      </p>

      <ol className="mt-5 space-y-5">
        <li>
          <h3 className="font-medium text-zinc-100">1 · Launch a runtime with rocm-vllm-docker</h3>
          <p className="text-zinc-400">Pull a ROCm runtime container and serve a model.</p>
          <pre className="mt-2 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs text-zinc-300">
{`docker run --rm -it \\
  --device /dev/kfd --device /dev/dri \\
  --group-add video --ipc host \\
  ghcr.io/radeon-arena/rocm-vllm:latest \\
  vllm serve Qwen/Qwen3-8B --quantization fp8`}
          </pre>
        </li>

        <li>
          <h3 className="font-medium text-zinc-100">2 · Measure with llama-benchy</h3>
          <p className="text-zinc-400">Point the benchmarker at the OpenAI-compatible endpoint.</p>
          <pre className="mt-2 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs text-zinc-300">
{`llama-benchy run \\
  --base-url http://localhost:8000/v1 \\
  --model Qwen/Qwen3-8B \\
  --tests pp2048,tg128,tg256 \\
  --concurrency 1,2,4`}
          </pre>
        </li>

        <li>
          <h3 className="font-medium text-zinc-100">3 · Submit with radeonrun</h3>
          <p className="text-zinc-400">Capture the full recipe and publish your result to the arena.</p>
          <pre className="mt-2 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs text-zinc-300">
{`radeonrun submit \\
  --results ./llama-benchy-results.json \\
  --gpu "Radeon PRO W7900"`}
          </pre>
        </li>
      </ol>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {Object.values(PROJECTS).map((p) => (
          <a key={p.name} href={p.url} className="btn-ghost">{p.name} →</a>
        ))}
      </div>
    </div>
  );
}
