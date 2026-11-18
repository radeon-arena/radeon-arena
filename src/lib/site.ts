// Central place for outbound links and project metadata.
// All external links point to real, public, working resources.
export const SITE = {
  name: "Radeon Arena",
  tagline: "LLM benchmarks and developer support for AMD Radeon",
  description:
    "Compare Large Language Model performance on AMD Radeon GPUs. Real benchmarks, real hardware, real results.",
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
    short: "Inference engine for AMD Radeon",
  },
  benchy: {
    name: "radeonrun",
    url: "https://github.com/radeon-arena/radeonrun",
    blurb: "Docker images + recipes for running vLLM and llama.cpp on AMD Radeon GPUs (Strix Halo / W7900 / R9700, ROCm).",
    short: "ROCm containers & recipes (Radeon)",
  },
  radeonrun: {
    name: "AMD ROCm",
    url: "https://github.com/ROCm/ROCm",
    blurb: "The AMD ROCm platform that powers GPU compute on Radeon hardware.",
    short: "GPU compute platform",
  },
};
