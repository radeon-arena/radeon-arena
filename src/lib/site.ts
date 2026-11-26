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
export const PROJECTS = {
  vllmDocker: {
    name: "ROCm vLLM",
    url: "https://github.com/ROCm/vllm",
    blurb: "AMD's ROCm build of vLLM — the engine behind the vLLM results on Radeon.",
    blurbZh: "AMD 为 ROCm 维护的 vLLM，Radeon 上 vLLM 结果用的就是它。",
    short: "Inference engine for AMD Radeon",
    shortZh: "AMD Radeon 上的推理引擎",
  },
  benchy: {
    name: "radeonrun",
    url: "https://github.com/radeon-arena/radeonrun",
    blurb: "Docker images + recipes for running vLLM and llama.cpp on AMD Radeon GPUs (Strix Halo / W7900 / R9700, ROCm).",
    blurbZh: "在 AMD Radeon 显卡（Strix Halo、W7900、R9700，ROCm）上运行 vLLM 和 llama.cpp 的镜像与配方。",
    short: "ROCm containers & recipes (Radeon)",
    shortZh: "面向 Radeon 的 ROCm 镜像与配方",
  },
  radeonrun: {
    name: "AMD ROCm",
    url: "https://github.com/ROCm/ROCm",
    blurb: "The AMD ROCm platform that powers GPU compute on Radeon hardware.",
    blurbZh: "AMD ROCm 平台，为 Radeon 硬件提供 GPU 计算能力。",
    short: "GPU compute platform",
    shortZh: "GPU 计算平台",
  },
};
