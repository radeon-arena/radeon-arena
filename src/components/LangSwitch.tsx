"use client";

import { usePathname } from "next/navigation";
import { enPath, lp, type Lang } from "@/lib/i18n";

// Globe icon button linking to the same page in the other language. Account
// pages are served by the API service and exist in English only.
export function LangSwitch({ lang }: { lang: Lang }) {
  const code: Lang = lang === "en" ? "zh" : "en";
  const hrefLang = code === "en" ? "en" : "zh-CN";
  const label = code === "en" ? "Switch to English" : "切换到中文";
  const to = (target: Lang, path: string) => (target === "en" ? enPath(path) : lp("zh", path));
  // nginx serves the 404 page under any address; its own route means nothing to visitors.
  const pathname = usePathname() || "/";
  const route = /\/page-not-found\/?$/.test(pathname) ? "/" : pathname;
  return (
    <a
      href={to(code, route)}
      hrefLang={hrefLang}
      lang={hrefLang}
      aria-label={label}
      title={label}
      // Keep the query string and #anchor (e.g. a docs section) when switching.
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        // Use the address in the bar, not the route: they differ on the 404 page.
        const bar = /\/page-not-found\/?$/.test(window.location.pathname) ? "/" : window.location.pathname;
        window.location.href = to(code, bar) + window.location.search + window.location.hash;
      }}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-ink-800 hover:text-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-radeon-500"
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
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </svg>
    </a>
  );
}
