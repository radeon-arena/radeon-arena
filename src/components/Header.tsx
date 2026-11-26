import Link from "next/link";
import { HARDWARE, DEFAULT_HW } from "@/lib/hardware";
import { lp, t, type Lang } from "@/lib/i18n";
import { LangSwitch } from "@/components/LangSwitch";

export function Header({ lang }: { lang: Lang }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const navItems = [
    { href: lp(lang, `/${DEFAULT_HW}/leaderboard`), label: t(lang, "Leaderboard", "榜单") },
    { href: lp(lang, `/${DEFAULT_HW}/recipes`), label: t(lang, "Recipes", "部署配方") },
    { href: lp(lang, "/docs"), label: t(lang, "API Docs", "API 文档") },
    { href: lp(lang, "/blogs"), label: t(lang, "Blog", "博客") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: logo + primary navigation */}
        <div className="flex min-w-0 items-center gap-1">
          <Link href={lp(lang, "/")} className="mr-2 flex shrink-0 items-center gap-2">
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
              <Link key={item.href} href={item.href} className="shrink-0 rounded-md px-2 py-1.5 text-zinc-300 hover:bg-ink-800 sm:px-3">
                {item.label}
              </Link>
            ))}
            <a href="/me" className="shrink-0 rounded-md px-2 py-1.5 text-zinc-300 hover:bg-ink-800 sm:px-3">
              {t(lang, "Account", "账户")}
            </a>
          </nav>
        </div>

        {/* Right: hardware / device selector and language */}
        <div className="flex shrink-0 items-center gap-1 text-sm">
          <div className="hidden items-center gap-1 sm:flex">
            {HARDWARE.map((h) =>
              h.disabled ? (
                <span
                  key={h.key}
                  title={`${h.label} — ${t(lang, "coming soon", "即将上线")}`}
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-md px-2.5 py-1.5 text-zinc-600"
                >
                  {h.short}
                </span>
              ) : (
                <Link
                  key={h.key}
                  href={lp(lang, `/${h.key}/leaderboard`)}
                  title={h.label}
                  className="rounded-md px-2.5 py-1.5 text-zinc-300 hover:bg-ink-800 hover:text-radeon-200"
                >
                  {h.short}
                </Link>
              ),
            )}
          </div>
          <LangSwitch lang={lang} />
        </div>
      </div>
    </header>
  );
}
