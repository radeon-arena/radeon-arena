"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { lp, t, type Lang } from "@/lib/i18n";

export type HeaderHardware = {
  key: string;
  short: string;
  label: string;
  disabled: boolean;
};

// Sections that exist under every hardware tab; switching tabs keeps the
// current section when it is one of these.
const HW_SECTIONS = ["leaderboard", "recipes", "submit"];

const LINK_BASE =
  "inline-flex h-8 shrink-0 items-center rounded-md px-3 transition-colors";
const LINK_ACTIVE = "font-medium text-zinc-50 shadow-[inset_0_-2px_0_#ED1C24]";
const LINK_IDLE = "text-zinc-300 hover:bg-ink-800 hover:text-zinc-50";

const SEG_BASE =
  "inline-flex h-7 shrink-0 items-center rounded-md px-2.5 text-sm transition-colors";
const SEG_ACTIVE = "bg-white font-semibold text-radeon-600 shadow-sm";
const SEG_IDLE = "text-zinc-300 hover:text-zinc-50";

export function HeaderNav({
  lang,
  hardware,
  defaultHw,
}: {
  lang: Lang;
  hardware: HeaderHardware[];
  defaultHw: string;
}) {
  const pathname = usePathname() || "/";
  // Drop the /zh prefix so the same section is recognised in both languages.
  const local = (lang === "zh" ? pathname.replace(/^\/zh(?=\/|$)/, "") : pathname)
    .replace(/\/+$/, "");
  const [, first = "", second = ""] = local.split("/");
  const hwKeys = hardware.map((h) => h.key);
  const activeHw = hwKeys.includes(first) ? first : null;
  // On hardware-scoped pages the section is the second segment.
  const section = activeHw ? second : first;

  const navItems = [
    {
      href: lp(lang, `/${defaultHw}/leaderboard`),
      label: t(lang, "Leaderboard", "榜单"),
      active: section === "leaderboard",
    },
    {
      href: lp(lang, `/${defaultHw}/recipes`),
      label: t(lang, "Recipes", "部署配方"),
      active: section === "recipes",
    },
    {
      href: lp(lang, "/docs"),
      label: t(lang, "API Docs", "API 文档"),
      active: section === "docs",
    },
    {
      href: lp(lang, "/blogs"),
      label: t(lang, "Blog", "博客"),
      active: section === "blogs",
    },
  ];
  const hwSection = HW_SECTIONS.includes(section) ? section : "leaderboard";

  return (
    <div className="order-3 flex h-11 w-full min-w-0 items-center gap-1 overflow-x-auto border-t border-ink-700 thin-scroll lg:order-none lg:contents">
      <nav
        aria-label={t(lang, "Main", "主导航")}
        className="order-1 flex shrink-0 items-center gap-1 text-sm lg:order-2 lg:min-w-0 lg:flex-1"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`${LINK_BASE} ${item.active ? LINK_ACTIVE : LINK_IDLE}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <span aria-hidden="true" className="order-2 mx-1 h-5 w-px shrink-0 bg-ink-700 lg:hidden" />

      <div
        role="group"
        aria-label={t(lang, "Hardware", "硬件")}
        className="order-3 flex shrink-0 items-center gap-0.5 rounded-lg bg-ink-800 p-0.5 lg:order-3"
      >
        {hardware.map((h) =>
          h.disabled ? (
            <span
              key={h.key}
              title={`${h.label} — ${t(lang, "coming soon", "即将上线")}`}
              aria-disabled="true"
              className={`${SEG_BASE} cursor-not-allowed text-zinc-500`}
            >
              {h.short}
            </span>
          ) : (
            <Link
              key={h.key}
              href={lp(lang, `/${h.key}/${hwSection}`)}
              title={h.label}
              aria-current={activeHw === h.key ? "page" : undefined}
              className={`${SEG_BASE} ${activeHw === h.key ? SEG_ACTIVE : SEG_IDLE}`}
            >
              {h.short}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

// Icon-only account link, rendered at the far right of the header. Account
// pages are served by the API service and exist in English only, so the link
// always points to /me.
export function AccountIcon({ lang }: { lang: Lang }) {
  const pathname = usePathname() || "/";
  const local = pathname.replace(/^\/zh(?=\/|$)/, "").replace(/\/+$/, "");
  const first = local.split("/")[1] ?? "";
  const active = ["me", "login", "device"].includes(first);
  const label = t(lang, "Account", "账户");
  return (
    <a
      href="/me"
      aria-label={label}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-radeon-500 ${
        active ? "bg-white text-zinc-50 shadow-sm" : "text-zinc-300 hover:bg-ink-800 hover:text-zinc-50"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
    </a>
  );
}
