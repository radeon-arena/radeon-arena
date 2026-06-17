import { SITE, PROJECTS, MAINTAINERS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Built With</h3>
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
              Maintained by members of the AMD Radeon developer community.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href={SITE.discord} className="btn-ghost">Join the Discussion</a>
              <a href={SITE.twitter} className="btn-ghost">Follow us on X</a>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">Maintainers</h3>
            <ul className="space-y-2 text-sm">
              {MAINTAINERS.map((m) => (
                <li key={m.name} className="flex items-center gap-2">
                  <span className="text-zinc-300">{m.name}</span>
                  <a href={m.forum} className="text-xs text-zinc-600 hover:text-radeon-400">Forum</a>
                  <a href={m.github} className="text-xs text-zinc-600 hover:text-radeon-400">GitHub</a>
                  <a href={m.linkedin} className="text-xs text-zinc-600 hover:text-radeon-400">LinkedIn</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-ink-800 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Radeon Arena. {SITE.tagline}.</p>
          <a href={SITE.discord} className="hover:text-radeon-400">Join Discord</a>
        </div>
      </div>
    </footer>
  );
}
