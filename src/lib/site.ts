// Central place for outbound links and project metadata.
// All external links point to real, public, working resources.
export const SITE = {
  name: "Radeon Arena",
  tagline: "LLM benchmarks and developer support for AMD Radeon",
  taglineZh: "AMD Radeon 大模型性能榜单与开发者支持",
  description:
    "Compare Large Language Model performance on AMD Radeon GPUs. Real benchmarks, real hardware, real results.",
  descriptionZh: "比较大模型在 AMD Radeon 显卡上的推理性能。真实跑分，真实硬件，真实结果。",
  github: "https://github.com/radeon-arena/radeon-arena",
  blog: "https://rocm.blogs.amd.com/",
  twitter: "https://x.com/amdradeon",
  community: "https://community.amd.com/t5/rocm/ct-p/amd-rocm",
  forum: "https://community.amd.com/t5/rocm/ct-p/amd-rocm",
  developer: "https://community.amd.com/t5/developers/ct-p/developers",
  cloud: "https://radeon.anruicloud.com/",
};

// Public API of the AMD GPU Support Agent (served by the A2A sidecar on this domain).
export const API = {
  docs: "/docs",
  endpoint: "https://radeon-arena.com/a2a",
  agentCard: "https://radeon-arena.com/.well-known/agent-card.json",
  requestSchema: "https://radeon-arena.com/a2a/schemas/request.v1.json",
  replySchema: "https://radeon-arena.com/a2a/schemas/reply.v1.json",
  llmsTxt: "/llms.txt",
  skillsRepo: "https://github.com/radeon-arena/skills",
  mcpRepo: "https://github.com/radeon-arena/mcp",
};

// The real open-source projects that produce the benchmark results.
// `engine: true` marks the inference engines; the rest are the harness and platform.
export const PROJECTS = {
  llamacpp: {
    name: "llama.cpp",
    url: "https://github.com/ggml-org/llama.cpp",
    engine: true,
    blurb: "GGUF inference with the ROCm/HIP backend. Most results on the board, from 2-bit to BF16, run on it.",
    blurbZh: "用 ROCm/HIP 后端跑 GGUF 模型。榜单上大部分结果（2 比特到 BF16）都是它跑的。",
    short: "Inference engine (GGUF, ROCm/HIP)",
    shortZh: "推理引擎（GGUF，ROCm/HIP）",
  },
  vllm: {
    name: "vLLM",
    url: "https://github.com/vllm-project/vllm",
    engine: true,
    blurb: "High-throughput serving engine on ROCm: BF16, AWQ, AMD Quark and AutoRound weights.",
    blurbZh: "ROCm 上的高吞吐推理服务引擎，跑 BF16、AWQ、AMD Quark 和 AutoRound 权重。",
    short: "Inference engine (serving)",
    shortZh: "推理引擎（推理服务）",
  },
  radeonrun: {
    name: "radeonrun",
    url: "https://github.com/radeon-arena/radeonrun",
    engine: false,
    blurb: "Pinned engine images, recipes and the benchmark harness for Radeon GPUs (Strix Halo, R9700, W7900).",
    blurbZh: "面向 Radeon 显卡（Strix Halo、R9700、W7900）的固定版本引擎镜像、配方和跑分工具。",
    short: "Images, recipes & benchmark harness",
    shortZh: "镜像、配方与跑分工具",
  },
  rocm: {
    name: "AMD ROCm",
    url: "https://github.com/ROCm/ROCm",
    engine: false,
    blurb: "The AMD ROCm platform that powers GPU compute on Radeon hardware.",
    blurbZh: "AMD ROCm 平台，为 Radeon 硬件提供 GPU 计算能力。",
    short: "GPU compute platform",
    shortZh: "GPU 计算平台",
  },
};
