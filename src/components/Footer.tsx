import { SITE, PROJECTS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Benchmark Engines</h3>
            <ul className="space-y-2 text-sm">
              {Object.values(PROJECTS).map((p) => (
                <li key={p.name}>
                  <a href={p.url} className="text-zinc-400 hover:text-radeon-400">
                    {p.name}
                  </a>
                  <p className="text-xs text-zinc-600">{p.short}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Community</h3>
            <p className="mb-3 text-sm text-zinc-500">
              Built on open-source inference engines and the AMD ROCm platform.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href={SITE.community} className="btn-ghost">AMD ROCm Community</a>
              <a href={SITE.blog} className="btn-ghost">ROCm Blog</a>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Data</h3>
            <p className="text-sm text-zinc-500">
              Benchmarks measured by InferStation on AMD RDNA hardware—Radeon 8060S
              (Strix Halo) and Radeon AI PRO R9700. Real numbers, refreshed continuously.
            </p>
            <a href="/leaderboard" className="mt-3 inline-block text-sm text-radeon-400 hover:text-radeon-300">
              Browse the leaderboard →
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-ink-800 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Radeon Arena. {SITE.tagline}.</p>
          <a href={SITE.community} className="hover:text-radeon-400">AMD ROCm Community</a>
        </div>
      </div>
    </footer>
  );
}
