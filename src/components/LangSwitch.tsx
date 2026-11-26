"use client";

import { usePathname } from "next/navigation";
import { enPath, lp, type Lang } from "@/lib/i18n";

// Link to the same page in the other language. Account pages are served by the
// API service and exist in English only.
export function LangSwitch({ lang }: { lang: Lang }) {
  const pathname = usePathname() || "/";
  const target = lang === "en" ? lp("zh", pathname) : enPath(pathname);
  return (
    <a
      href={target}
      hrefLang={lang === "en" ? "zh-CN" : "en"}
      className="shrink-0 rounded-md border border-ink-700 px-2.5 py-1 text-zinc-300 hover:bg-ink-800"
    >
      {lang === "en" ? "中文" : "English"}
    </a>
  );
}
