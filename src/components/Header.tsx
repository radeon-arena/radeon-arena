import Link from "next/link";
import { SITE } from "@/lib/site";
import { DEFAULT_HW } from "@/lib/hardware";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" width={20} height={20} />
          </span>
          <span className="font-semibold tracking-tight text-zinc-100">
            Radeon<span className="text-radeon-500">Arena</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href={`/${DEFAULT_HW}/leaderboard`} className="rounded-md px-3 py-1.5 text-zinc-300 hover:bg-ink-800">
            Leaderboard
          </Link>
          <Link href={`/${DEFAULT_HW}/compare`} className="hidden rounded-md px-3 py-1.5 text-zinc-300 hover:bg-ink-800 sm:block">
            Compare
          </Link>
          <a href={SITE.blog} className="hidden rounded-md px-3 py-1.5 text-zinc-300 hover:bg-ink-800 sm:block">
            Blog
          </a>
          <a
            href={SITE.twitter}
            className="ml-1 rounded-md px-3 py-1.5 text-zinc-400 hover:bg-ink-800"
            aria-label="Twitter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}
