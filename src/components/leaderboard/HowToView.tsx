import { PROJECTS } from "@/lib/site";

export function HowToView() {
  return (
    <div className="card p-7 text-sm leading-relaxed text-zinc-300">
      <h2 className="text-lg font-semibold text-zinc-100">How These Benchmarks Are Produced</h2>
      <p className="mt-2 text-zinc-400">
        The results on this leaderboard are measured by an automated harness (InferStation) that runs
        open-source inference engines on AMD RDNA hardware and records streaming throughput, TTFT and TPOT.
        The methodology below uses only real, public tools so you can reproduce a comparable run.
      </p>

      <ol className="mt-5 space-y-5">
        <li>
          <h3 className="font-medium text-zinc-100">1 · Serve a model on ROCm</h3>
          <p className="text-zinc-400">
            Use AMD&apos;s ROCm build of vLLM, or llama.cpp built with the ROCm/HIP (or Vulkan) backend.
          </p>
          <pre className="mt-2 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs text-zinc-300">
{`# vLLM on ROCm
docker run --rm -it \\
  --device /dev/kfd --device /dev/dri \\
  --group-add video --ipc host \\
  rocm/vllm:latest \\
  vllm serve Qwen/Qwen3-8B --max-model-len 4096

# or llama.cpp (ROCm/HIP)
llama-server -m model.gguf -ngl 999 \\
  --host 0.0.0.0 --port 8000`}
          </pre>
        </li>

        <li>
          <h3 className="font-medium text-zinc-100">2 · Measure streaming throughput</h3>
          <p className="text-zinc-400">
            Drive the OpenAI-compatible endpoint with a fixed input/output shape (in512 / out128) across
            concurrency levels, recording per-request TTFT and inter-token latency from the SSE stream.
          </p>
          <pre className="mt-2 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs text-zinc-300">
{`# vLLM ships a serving benchmark:
vllm bench serve \\
  --base-url http://localhost:8000 \\
  --model Qwen/Qwen3-8B \\
  --dataset-name random --random-input-len 512 \\
  --random-output-len 128 --max-concurrency 1`}
          </pre>
        </li>

        <li>
          <h3 className="font-medium text-zinc-100">3 · Compare against the board</h3>
          <p className="text-zinc-400">
            The leaderboard reports decode tok/s (tg128), prefill tok/s (pp512), TTFT and TPOT per
            concurrency level. Match your engine, backend, quantization and GPU to read the closest row.
          </p>
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
