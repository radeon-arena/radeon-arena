import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { SITE, PROJECTS } from "@/lib/site";

const FEATURES = [
  {
    title: "Real Performance",
    body: "Measured benchmarks from RadeonArena automated runs on AMD RDNA hardware — Radeon 8060S (Strix Halo) and Radeon AI PRO R9700.",
  },
  {
    title: "Multiple Runtimes",
    body: "Compare vLLM and llama.cpp across ROCm/HIP and Vulkan backends.",
  },
  {
    title: "Full Transparency",
    body: "View complete recipes, engine versions, quantization, and detailed benchmark results.",
  },
];

export default function HomePage() {
  return (
    <div>
      <div className="border-b border-ink-800 bg-ink-950/50">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs text-zinc-500 sm:px-6">
          Benchmarks run with:{" "}
          <a href={PROJECTS.vllmDocker.url} className="text-zinc-400 hover:text-radeon-400">{PROJECTS.vllmDocker.name}</a> ·{" "}
          <a href={PROJECTS.radeonrun.url} className="text-zinc-400 hover:text-radeon-400">{PROJECTS.radeonrun.name}</a> ·{" "}
          <a href={SITE.blog} className="text-zinc-400 hover:text-radeon-400">ROCm Blog</a> ·{" "}
          <a href={PROJECTS.benchy.url} className="text-zinc-400 hover:text-radeon-400">{PROJECTS.benchy.name}</a>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Radeon <span className="text-radeon-500">Arena</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">{SITE.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/strix/leaderboard" className="btn-primary">View Leaderboard</Link>
          <Link href="/strix/recipes" className="btn-ghost">Browse Recipes</Link>
          <Link href="/strix/compare" className="btn-ghost">Compare Models</Link>
          <Link href="/strix/submit" className="btn-ghost">Submit Benchmark</Link>
        </div>
      </section>

      <Carousel />

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="mb-2 font-semibold text-zinc-100">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open-source engines that produced the data */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-zinc-100">Benchmark Engines</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            The numbers on this leaderboard were produced by these open-source inference engines
            running on AMD ROCm hardware. (This site itself is a static Next.js app — it just
            collects and displays their results.)
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {Object.values(PROJECTS).map((p) => (
              <div key={p.name} className="rounded-lg border border-ink-700 bg-ink-850 p-5">
                <h3 className="font-medium text-zinc-100">{p.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{p.blurb}</p>
                <a href={p.url} className="mt-3 inline-block text-sm text-radeon-400 hover:text-radeon-300">
                  View on GitHub →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical blog */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-4 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Technical Blog</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Deep dives, runbooks, and benchmarking notes covering reproducibility, runtime tuning, and practical
              performance investigations from the community.
            </p>
          </div>
          <a href={SITE.blog} className="btn-primary shrink-0">Visit Technical Blog</a>
        </div>
      </section>
    </div>
  );
}
