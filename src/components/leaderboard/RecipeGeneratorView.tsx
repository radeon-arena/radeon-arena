"use client";

import { useState } from "react";
import yaml from "js-yaml";

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
      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to generate recipe");
        return;
      }
      setErrors(data.validationErrors ?? []);
      setYamlOut(yaml.dump(data.recipe?.fullRecipe ?? data.recipe, { indent: 2, lineWidth: -1, noRefs: true }));
    } catch {
      setMessage("Network error");
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
        {message && <p className="mt-3 text-sm text-amber-400">{message}</p>}
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
          <ul className="mb-2 list-disc pl-5 text-xs text-amber-400">
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
