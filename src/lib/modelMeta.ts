import type { Quantization } from "./types";

/**
 * Rough parameter-count estimation from a model name. Handles patterns like
 * "32B", "8x7B", and MoE notations such as "35B-A3B" (total params = 35B).
 * Falls back to a small default when nothing parses.
 */
export function estimateParamsB(modelName: string, modelFullPath = ""): number {
  const hay = `${modelName} ${modelFullPath}`;

  // "8x7B" style mixtures -> 56B
  const moeMul = hay.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*B/i);
  if (moeMul) {
    return parseInt(moeMul[1], 10) * parseFloat(moeMul[2]);
  }

  // First "<num>B" token is the total parameter count (ignores "-A3B" active).
  const totalMatch = hay.match(/(\d+(?:\.\d+)?)\s*B(?![a-zA-Z])/);
  if (totalMatch) {
    return parseFloat(totalMatch[1]);
  }

  // "<num>M" -> billions
  const mMatch = hay.match(/(\d+(?:\.\d+)?)\s*M(?![a-zA-Z])/);
  if (mMatch) {
    return parseFloat(mMatch[1]) / 1000;
  }

  return 7; // sensible default
}

/** Approximate bytes-per-parameter for a given quantization format. */
export function bytesPerParam(q: Quantization): number {
  const s = String(q).toLowerCase();
  // GGUF formats (llama.cpp): Q8 ~1 B/param, Q6 ~0.8, Q5 ~0.7, Q4 ~0.5, Q3 ~0.4, Q2 ~0.3.
  if (s.includes("q8")) return 1;
  if (s.includes("q6")) return 0.8;
  if (s.includes("q5")) return 0.7;
  if (s.includes("q4")) return 0.5;
  if (s.includes("q3")) return 0.4;
  if (s.includes("q2")) return 0.3;
  switch (q) {
    case "BF16":
    case "FP16":
      return 2;
    case "FP8":
    case "FP8-block":
    case "INT8":
    case "Q8_0":
    case "Quark-W8A8-INT8":
      return 1;
    case "AWQ":
    case "AWQ-4bit":
    case "GPTQ":
    case "INT4":
    case "MXFP4":
    case "FP4":
    case "NVFP4":
      return 0.5;
    default:
      // BF16/FP16-ish names default to 2 bytes.
      if (s.includes("fp8") || s.includes("int8") || s.includes("w8")) return 1;
      if (s.includes("fp4") || s.includes("int4") || s.includes("awq") || s.includes("4bit")) return 0.5;
      return 2;
  }
}

/**
 * Estimated weights VRAM footprint (GB) = params(B) * bytesPerParam * 1.2
 * overhead for KV cache / activations headroom.
 */
export function estimateVramGb(modelName: string, q: Quantization, modelFullPath = ""): number {
  const params = estimateParamsB(modelName, modelFullPath);
  return Math.round(params * bytesPerParam(q) * 1.2 * 10) / 10;
}

/** Friendly organization label from an HF namespace. */
export function orgDisplayName(ns: string): string {
  const map: Record<string, string> = {
    qwen: "Qwen",
    "meta-llama": "Meta Llama",
    google: "Google",
    deepseek: "DeepSeek",
    deepseekai: "DeepSeek",
    mistralai: "Mistral AI",
    minimax: "MiniMax",
    minimaxai: "MiniMax",
    nvidia: "NVIDIA",
    amd: "AMD",
    openai: "OpenAI",
    redhatai: "RedHat AI",
    liquidai: "Liquid AI",
    zai: "Z.ai",
    "zai-org": "Z.ai",
    xiaomi: "Xiaomi",
    stepfun: "StepFun",
    microsoft: "Microsoft",
  };
  return map[ns.toLowerCase()] ?? ns;
}
