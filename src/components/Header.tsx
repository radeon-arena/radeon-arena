import Link from "next/link";
import { HARDWARE, DEFAULT_HW } from "@/lib/hardware";

export function Header() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const navItems = [
    { href: `/${DEFAULT_HW}/leaderboard`, label: "Leaderboard" },
    { href: `/${DEFAULT_HW}/recipes`, label: "Recipes" },
    { href: `/${DEFAULT_HW}/organizations`, label: "Organizations" },
    { href: `/${DEFAULT_HW}/submit`, label: "Submit" },
    { href: "/blogs", label: "Blog" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: logo + primary navigation */}
        <div className="flex min-w-0 items-center gap-1">
          <Link href="/" className="mr-2 flex shrink-0 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-ink-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${basePath}/icon.svg`} alt="" width={20} height={20} />
            </span>
            <span className="font-semibold tracking-tight text-zinc-100">
              Radeon<span className="text-radeon-500">Arena</span>
            </span>
          </Link>
          <nav className="thin-scroll flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-md px-3 py-1.5 text-zinc-300 hover:bg-ink-800">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: hardware / device selector */}
        <div className="hidden items-center gap-1 text-sm sm:flex">
          {HARDWARE.map((h) =>
            h.disabled ? (
              <span
                key={h.key}
                title={`${h.label} — coming soon`}
                aria-disabled="true"
                className="cursor-not-allowed rounded-md px-2.5 py-1.5 text-zinc-600"
              >
                {h.short}
              </span>
            ) : (
              <Link
                key={h.key}
                href={`/${h.key}/leaderboard`}
                title={h.label}
                className="rounded-md px-2.5 py-1.5 text-zinc-300 hover:bg-ink-800 hover:text-radeon-200"
              >
                {h.short}
              </Link>
            ),
          )}
        </div>
      </div>
    </header>
  );
}
