"use client";

import { useState } from "react";
import yaml from "js-yaml";
import type { Recipe } from "@/lib/types";

const PLACEHOLDER = `vllm serve Qwen/Qwen3-8B \\
  --quantization fp8 \\
  --tensor-parallel-size 1 \\
  --max-model-len 32768 \\
  --gpu-memory-utilization 0.9`;

export function RecipeGeneratorView() {
  const [command, setCommand] = useState("");
  const [description, setDescription] = useState("");
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
      const data = parseCommand(command, description || undefined);
      setErrors(data.validationErrors);
      setYamlOut(yaml.dump(data.recipe.fullRecipe ?? data.recipe, { indent: 2, lineWidth: -1, noRefs: true }));
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
        <button onClick={generate} disabled={loading || !command.trim()} className="btn-primary mt-4 disabled:opacity-50">
          {loading ? "Generating…" : "Generate Recipe"}
        </button>
        {message && <p className="mt-3 text-sm text-amber-600">{message}</p>}
      </div>

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-zinc-500">recipe.yaml</span>
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

function parseCommand(command: string, description?: string): { recipe: Recipe; validationErrors: string[] } {
  const errors: string[] = [];
  const lower = command.toLowerCase();
  let runtime = "vLLM";
  let container = "rocm/vllm:latest";
  if (lower.includes("sglang")) {
    runtime = "SGLang";
    container = "lmsysorg/sglang:latest";
  } else if (lower.includes("llama-server") || lower.includes("llama.cpp") || lower.includes("llama-cli")) {
    runtime = "llama.cpp";
    container = "ghcr.io/ggml-org/llama.cpp:full-rocm";
  } else if (lower.includes("mlc")) {
    runtime = "MLC-LLM";
    container = "rocm/mlc:latest";
  }
  const serveMatch = command.match(/serve\s+([^\s\\]+)/);
  const flagMatch = command.match(/--model(?:-path)?[ =]+([^\s\\]+)/) || command.match(/(?:^|\s)-m[ =]+([^\s\\]+)/);
  const model = serveMatch?.[1] ?? flagMatch?.[1] ?? "";
  if (!model) errors.push("Could not detect a model path in the command.");
  const tpMatch = command.match(/--tensor-parallel-size[ =]+(\d+)/) || command.match(/--tp[ =]+(\d+)/);
  const clusterSize = tpMatch ? parseInt(tpMatch[1], 10) : 1;
  const quantMatch = command.match(/--quantization[ =]+([^\s\\]+)/);
  const quantization = quantMatch?.[1];
  return {
    validationErrors: errors,
    recipe: {
      name: model ? `${model.split("/").pop()} · ${runtime}` : `${runtime} recipe`,
      version: 1,
      command: command.trim(),
      container,
      model: model || undefined,
      description: description?.trim() || `${runtime} serving recipe${model ? ` for ${model}` : ""}.`,
      clusterOnly: clusterSize > 1,
      fullRecipe: { runtime, container, clusterSize, quantization, command: command.trim() },
    },
  };
}
