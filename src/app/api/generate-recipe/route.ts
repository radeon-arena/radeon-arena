import { NextResponse } from "next/server";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

interface GenerateBody {
  command?: string;
  description?: string;
  clusterOnly?: boolean;
  notes?: string;
}

/** Best-effort structured recipe extraction from a raw serve command. */
function parseCommand(command: string, body: GenerateBody): { recipe: Recipe; validationErrors: string[] } {
  const errors: string[] = [];
  const lower = command.toLowerCase();

  let runtime = "vLLM";
  // Default to real, public ROCm container images (pin a specific tag/commit for a reproducible recipe).
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

  // model: token after `serve` / `--model-path` / `--model` / `-m`.
  let model = "";
  const serveMatch = command.match(/serve\s+([^\s\\]+)/);
  const flagMatch = command.match(/--model(?:-path)?[ =]+([^\s\\]+)/) || command.match(/(?:^|\s)-m[ =]+([^\s\\]+)/);
  if (serveMatch) model = serveMatch[1];
  else if (flagMatch) model = flagMatch[1];
  if (!model) errors.push("Could not detect a model path in the command.");

  const tpMatch = command.match(/--tensor-parallel-size[ =]+(\d+)/) || command.match(/--tp[ =]+(\d+)/);
  const clusterSize = tpMatch ? parseInt(tpMatch[1], 10) : 1;
  const quantMatch = command.match(/--quantization[ =]+([^\s\\]+)/);
  const quantization = quantMatch ? quantMatch[1] : undefined;

  const recipe: Recipe = {
    name: model ? `${model.split("/").pop()} · ${runtime}` : `${runtime} recipe`,
    version: 1,
    command: command.trim(),
    container,
    model: model || undefined,
    description: body.description?.trim() || `${runtime} serving recipe${model ? ` for ${model}` : ""}.`,
    clusterOnly: body.clusterOnly ?? clusterSize > 1,
    fullRecipe: {
      runtime,
      container,
      clusterSize,
      quantization,
      notes: body.notes?.trim() || undefined,
      command: command.trim(),
    },
  };
  return { recipe, validationErrors: errors };
}

// POST /api/generate-recipe — public recipe formatter (reads no data, no auth).
export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const command = (body.command ?? "").toString();
  if (!command.trim()) {
    return NextResponse.json({ error: "A serve command is required" }, { status: 400 });
  }
  if (command.length > 8000) {
    return NextResponse.json({ error: "Command too long" }, { status: 413 });
  }

  const { recipe, validationErrors } = parseCommand(command, body);
  return NextResponse.json({
    recipe,
    valid: validationErrors.length === 0,
    validationErrors,
  });
}
