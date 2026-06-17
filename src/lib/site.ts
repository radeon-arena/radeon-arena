// Central place for outbound links and project metadata.
export const SITE = {
  name: "Radeon Arena",
  tagline: "Community-driven LLM benchmarking for AMD Radeon",
  description:
    "Compare Large Language Model performance on AMD Radeon GPUs. Real benchmarks, real hardware, real results.",
  blog: "https://blog.radeon-arena.com",
  twitter: "https://x.com/radeon_arena",
  discord: "https://discord.gg/radeon-arena",
  forum: "https://community.amd.com/t5/rocm/ct-p/amd-rocm",
};

export const PROJECTS = {
  vllmDocker: {
    name: "rocm-vllm-docker",
    url: "https://github.com/radeon-arena/rocm-vllm-docker",
    blurb: "Docker containers and recipes for running LLM inference engines on AMD Radeon",
    short: "Runtime containers for AMD Radeon",
  },
  benchy: {
    name: "llama-benchy",
    url: "https://github.com/radeon-arena/llama-benchy",
    blurb: "Comprehensive benchmarking tool for measuring LLM inference performance across different workloads",
    short: "Benchmarking tool for LLM inference",
  },
  radeonrun: {
    name: "radeonrun",
    url: "https://github.com/radeon-arena/radeonrun",
    blurb: "Launch, manage, and stop LLM inference workloads on AMD Radeon systems",
    short: "CLI tool for running Radeon Arena recipes",
  },
};

export interface Maintainer {
  name: string;
  forum: string;
  linkedin: string;
  github: string;
}

// Fictional community maintainers — no real personal data.
export const MAINTAINERS: Maintainer[] = [
  {
    name: "Alex Chen",
    forum: "https://community.amd.com/t5/user/viewprofilepage/user-id/101",
    linkedin: "https://www.linkedin.com/in/alexchen/",
    github: "https://github.com/alexchen",
  },
  {
    name: "Priya Nair",
    forum: "https://community.amd.com/t5/user/viewprofilepage/user-id/303",
    linkedin: "https://www.linkedin.com/in/priyanair/",
    github: "https://github.com/priyanair",
  },
  {
    name: "Marcus Feld",
    forum: "https://community.amd.com/t5/user/viewprofilepage/user-id/202",
    linkedin: "https://www.linkedin.com/in/marcusfeld/",
    github: "https://github.com/marcusfeld",
  },
];
