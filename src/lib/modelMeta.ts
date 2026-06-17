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
  switch (q) {
    case "BF16":
    case "FP16":
      return 2;
    case "FP8":
    case "INT8":
    case "Q8_0":
      return 1;
    case "AWQ":
    case "GPTQ":
    case "INT4":
    case "MXFP4":
    case "Q4_K_M":
      return 0.5;
    default:
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
  };
  return map[ns.toLowerCase()] ?? ns;
}
