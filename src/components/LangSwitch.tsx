"use client";

import { usePathname } from "next/navigation";
import { enPath, lp, type Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string; hrefLang: string }[] = [
  { code: "en", label: "EN", hrefLang: "en" },
  { code: "zh", label: "中文", hrefLang: "zh-CN" },
];

// Segmented switch showing both languages. The current one is highlighted; the
// other links to the same page in that language. Account pages are served by
// the API service and exist in English only.
export function LangSwitch({ lang }: { lang: Lang }) {
  const to = (target: Lang, path: string) => (target === "en" ? enPath(path) : lp("zh", path));
  // nginx serves the 404 page under any address; its own route means nothing to visitors.
  const pathname = usePathname() || "/";
  const route = /\/page-not-found\/?$/.test(pathname) ? "/" : pathname;
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-ink-800 p-0.5 text-sm"
    >
      {LANGS.map(({ code, label, hrefLang }) =>
        code === lang ? (
          <span
            key={code}
            lang={hrefLang}
            aria-current="true"
            className="inline-flex h-7 items-center rounded-md bg-white px-2.5 font-semibold text-zinc-50 shadow-sm"
          >
            {label}
          </span>
        ) : (
          <a
            key={code}
            href={to(code, route)}
            hrefLang={hrefLang}
            lang={hrefLang}
            // Keep the query string and #anchor (e.g. a docs section) when switching.
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              // Use the address in the bar, not the route: they differ on the 404 page.
              const bar = /\/page-not-found\/?$/.test(window.location.pathname) ? "/" : window.location.pathname;
              window.location.href = to(code, bar) + window.location.search + window.location.hash;
            }}
            className="inline-flex h-7 items-center rounded-md px-2.5 text-zinc-300 hover:text-zinc-50"
          >
            {label}
          </a>
        ),
      )}
    </div>
  );
}
