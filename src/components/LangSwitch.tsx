"use client";

import { usePathname } from "next/navigation";
import { enPath, lp, type Lang } from "@/lib/i18n";

// Link to the same page in the other language. Account pages are served by the
// API service and exist in English only.
export function LangSwitch({ lang }: { lang: Lang }) {
  const other = (path: string) => (lang === "en" ? lp("zh", path) : enPath(path));
  // nginx serves the 404 page under any address; its own route means nothing to visitors.
  const pathname = usePathname() || "/";
  const target = /\/page-not-found\/?$/.test(pathname) ? other("/") : other(pathname);
  return (
    <a
      href={target}
      hrefLang={lang === "en" ? "zh-CN" : "en"}
      // Keep the query string and #anchor (e.g. a docs section) when switching.
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        // Use the address in the bar, not the route: they differ on the 404 page.
        window.location.href = other(window.location.pathname) + window.location.search + window.location.hash;
      }}
      className="shrink-0 rounded-md border border-ink-700 px-2.5 py-1 text-zinc-300 hover:bg-ink-800"
    >
      {lang === "en" ? "中文" : "English"}
    </a>
  );
}
