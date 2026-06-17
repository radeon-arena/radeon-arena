import { NextResponse } from "next/server";
import { getAdminAuth, adminEnabled } from "@/lib/firebaseAdmin";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

interface GenerateBody {
  command?: string;
  description?: string;
  clusterOnly?: boolean;
  notes?: string;
}

/** Verify the caller is signed in. Mirrors the original gated endpoint. */
async function requireUser(req: Request): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "Sign in to generate recipes" };
  if (adminEnabled()) {
    try {
      await getAdminAuth()!.verifyIdToken(token);
    } catch {
      return { ok: false, status: 401, error: "Invalid or expired session" };
    }
  }
  return { ok: true };
}

/** Best-effort structured recipe extraction from a raw serve command. */
function parseCommand(command: string, body: GenerateBody): { recipe: Recipe; validationErrors: string[] } {
  const errors: string[] = [];
  const lower = command.toLowerCase();

  let runtime = "vLLM";
  let container = "ghcr.io/radeon-arena/rocm-vllm:latest";
  if (lower.includes("sglang")) {
    runtime = "SGLang";
    container = "ghcr.io/radeon-arena/rocm-sglang:latest";
  } else if (lower.includes("llama-server") || lower.includes("llama.cpp") || lower.includes("llama-cli")) {
    runtime = "llama.cpp";
    container = "ghcr.io/radeon-arena/rocm-llamacpp:latest";
  } else if (lower.includes("mlc")) {
    runtime = "MLC-LLM";
    container = "ghcr.io/radeon-arena/rocm-mlc:latest";
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

// POST /api/generate-recipe — gated: requires a signed-in user (Bearer token).
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

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
