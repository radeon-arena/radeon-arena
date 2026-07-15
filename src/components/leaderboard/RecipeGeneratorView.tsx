"use client";

import { useState } from "react";
import yaml from "js-yaml";

const PLACEHOLDER = `vllm serve Qwen/Qwen3-8B \\
  --quantization fp8 \\
  --tensor-parallel-size 1 \\
  --max-model-len 32768 \\
  --gpu-memory-utilization 0.9`;

export function RecipeGeneratorView({ hw }: { hw?: string }) {
  const [command, setCommand] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [yamlOut, setYamlOut] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function generate() {
    setLoading(true);
    setMessage(null);
    setYamlOut(null);
    setErrors([]);
    try {
      const data = parseCommand(command, {
        description: description || undefined,
        image: image || undefined,
        source: source || undefined,
        device: hw === "strix" ? "halo" : hw || "halo",
      });
      setErrors(data.validationErrors);
      setYamlOut(data.documents.map((document) => `# ${document.file}\n${yaml.dump(document.data, { indent: 2, lineWidth: -1, noRefs: true }).trim()}`).join("\n---\n"));
    } catch {
      setMessage("Failed to generate recipe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5">
        <label className="mb-1 block text-xs text-zinc-500">Serve command</label>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={8}
          className="w-full rounded-lg border border-ink-600 bg-ink-950 p-3 font-mono text-xs text-zinc-200"
        />
        <label className="mb-1 mt-3 block text-xs text-zinc-500">Description (optional)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-ink-600 bg-ink-950 p-2 text-sm text-zinc-200"
        />
        <label className="mb-1 mt-3 block text-xs text-zinc-500">OCI image (recommended)</label>
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="docker.io/vendor/runtime:tag or registry/repo@sha256:..."
          className="w-full rounded-lg border border-ink-600 bg-ink-950 p-2 font-mono text-xs text-zinc-200"
        />
        <label className="mb-1 mt-3 block text-xs text-zinc-500">Hugging Face source (recommended)</label>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="org/model"
          className="w-full rounded-lg border border-ink-600 bg-ink-950 p-2 font-mono text-xs text-zinc-200"
        />
        <button onClick={generate} disabled={loading || !command.trim()} className="btn-primary mt-4 disabled:opacity-50">
          {loading ? "Generating…" : "Generate Matrix Draft"}
        </button>
        {message && <p className="mt-3 text-sm text-amber-600">{message}</p>}
      </div>

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-zinc-500">model + launch + matrix YAML</span>
          {yamlOut && (
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(yamlOut);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  setMessage("Clipboard unavailable — select the text and copy manually.");
                }
              }}
              className="text-xs text-radeon-400 hover:text-radeon-300"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          )}
        </div>
        {errors.length > 0 && (
          <ul className="mb-2 list-disc pl-5 text-xs text-amber-600">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        <pre className="thin-scroll min-h-[12rem] overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs text-zinc-300">
{yamlOut ?? "// Paste a serve command and click Generate."}
        </pre>
      </div>
    </div>
  );
}

type DraftOptions = { description?: string; image?: string; source?: string; device: string };
type DraftDocument = { file: string; data: Record<string, unknown> };

function configId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "model";
}

function parseCommand(command: string, options: DraftOptions): { documents: DraftDocument[]; validationErrors: string[] } {
  const errors: string[] = [];
  const lower = command.toLowerCase();
  let runtime = "vllm";
  let inferredImage = "rocm/vllm:latest";
  if (lower.includes("sglang")) {
    runtime = "sglang";
    inferredImage = "lmsysorg/sglang:latest";
  } else if (lower.includes("llama-server") || lower.includes("llama.cpp") || lower.includes("llama-cli")) {
    runtime = "llamacpp";
    inferredImage = "ghcr.io/ggml-org/llama.cpp:full-rocm";
  } else if (lower.includes("mlc")) {
    runtime = "mlc-llm";
    inferredImage = "rocm/mlc:latest";
  }
  const serveMatch = command.match(/serve\s+([^\s\\]+)/);
  const flagMatch = command.match(/--model(?:-path)?[ =]+([^\s\\]+)/) || command.match(/(?:^|\s)-m[ =]+([^\s\\]+)/);
  const model = serveMatch?.[1] ?? flagMatch?.[1] ?? "";
  if (!model) errors.push("Could not detect a model path in the command.");
  const tpMatch = command.match(/--tensor-parallel-size[ =]+(\d+)/) || command.match(/--tp[ =]+(\d+)/);
  const clusterSize = tpMatch ? parseInt(tpMatch[1], 10) : 1;
  const quantMatch = command.match(/--quantization[ =]+([^\s\\]+)/);
  const quantization = quantMatch?.[1] ?? "unknown";
  const servedMatch = command.match(/--served-model-name(?:=|\s+)([^\s\\]+)/) || command.match(/--alias(?:=|\s+)([^\s\\]+)/);
  const servedName = servedMatch?.[1];
  const inferredSource = model && !model.startsWith("/") && model.includes("/") ? model : undefined;
  const modelPath = model.startsWith("/") ? model : model ? `/models/${model.split("/").pop()}` : "/models/TODO";
  const modelId = configId(`${model.split("/").pop() || "model"}-${quantization}`);
  const launchId = configId(`${runtime}-${quantization}`);
  const matrixId = configId(`${modelId}-${runtime}-${options.device}`);
  const defaults: Record<string, unknown> = {};
  let template = command.trim();
  if (model) template = template.replace(model, "{model.path}");
  if (servedName) template = template.replace(servedName, "{model.served_name}");
  const replacements: [RegExp, string, string, (value: string) => unknown][] = [
    [/(--host[ =]+)([^\s\\]+)/, "$1{host}", "host", String],
    [/(--port[ =]+)(\d+)/, "$1{port}", "port", Number],
    [/(--max-num-seqs[ =]+|-np[ =]+)(\d+)/, "$1{nseq}", "nseq", Number],
    [/(--max-model-len[ =]+|-c[ =]+)(\d+)/, "$1{ctx}", "ctx", Number],
  ];
  for (const [pattern, replacement, key, cast] of replacements) {
    const match = template.match(pattern);
    if (match) {
      defaults[key] = cast(match[2]);
      template = template.replace(pattern, replacement);
    }
  }
  if (!options.image) errors.push("Confirm the inferred OCI image or enter an explicit image reference.");
  if (!options.source && !inferredSource) errors.push("Add the Hugging Face source/revision before submitting.");
  return {
    validationErrors: errors,
    documents: [
      {
        file: `models/${modelId}.yaml`,
        data: {
          spec_version: "1", id: modelId, path: modelPath,
          source: options.source || inferredSource || "TODO/org-model", served_name: servedName || modelId,
          quantization, description: options.description?.trim() || `${modelId} model artifact`,
        },
      },
      {
        file: `launches/${launchId}.yaml`,
        data: {
          spec_version: "1", id: launchId, runtime, container: runtime,
          image: { ref: options.image || inferredImage }, defaults,
          topology: { gpu_count: clusterSize }, env: {}, mods: [], command: template,
        },
      },
      {
        file: `matrices/${matrixId}.yaml`,
        data: { matrix_version: "1", id: matrixId, model: modelId, launch: launchId, device: options.device, benchmark: "halo-arena-v1" },
      },
    ],
  };
}
