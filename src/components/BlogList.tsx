"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fmtDate } from "@/lib/format";
import { lp, t, type Lang } from "@/lib/i18n";

export type BlogListItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readingMinutes: number;
  hardware: string[];
  engines: string[];
};

type Filter = { key: string; label: string; match: (p: BlogListItem) => boolean };

// One list of every post, newest first, with filter chips for hardware and
// engine. The chosen filter is kept in ?tag= so a filtered view can be shared.
export function BlogList({ lang, posts, hardware }: { lang: Lang; posts: BlogListItem[]; hardware: string[] }) {
  const filters = useMemo<Filter[]>(() => {
    const list: Filter[] = [{ key: "all", label: t(lang, "All", "全部"), match: () => true }];
    for (const h of hardware) {
      if (posts.some((p) => p.hardware.includes(h))) list.push({ key: h, label: h, match: (p) => p.hardware.includes(h) });
    }
    for (const e of ["vLLM", "llama.cpp"]) {
      // "vLLM (main)" is the upstream vLLM build; it counts as vLLM here.
      const match = (p: BlogListItem) => p.engines.some((x) => x === e || x.startsWith(`${e} `));
      if (posts.some(match)) list.push({ key: e, label: e, match });
    }
    return list;
  }, [lang, posts, hardware]);

  const [active, setActive] = useState("all");

  useEffect(() => {
    const tag = new URLSearchParams(window.location.search).get("tag");
    if (tag && filters.some((f) => f.key === tag)) setActive(tag);
  }, [filters]);

  const choose = (key: string) => {
    setActive(key);
    const url = new URL(window.location.href);
    if (key === "all") url.searchParams.delete("tag");
    else url.searchParams.set("tag", key);
    window.history.replaceState(null, "", url.toString());
  };

  const current = filters.find((f) => f.key === active) ?? filters[0];
  const shown = posts.filter(current.match);
  const sep = lang === "zh" ? "、" : ", ";

  return (
    <>
      <div role="group" aria-label={t(lang, "Filter posts", "筛选文章")} className="mt-10 flex flex-wrap gap-2">
        {filters.map((f) => {
          const on = f.key === current.key;
          const count = posts.filter(f.match).length;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => choose(f.key)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-radeon-500 ${
                on ? "border-zinc-50 bg-zinc-50 text-white" : "border-ink-700 text-zinc-300 hover:border-zinc-400 hover:text-zinc-50"
              }`}
            >
              {f.label}
              <span className={on ? "text-zinc-700" : "text-zinc-500"}>{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="mt-8 border-t border-ink-700" aria-live="polite">
        {shown.map((p) => {
          const meta = [...p.hardware, ...p.engines].join(sep);
          return (
            <li key={p.slug} className="border-b border-ink-700">
              <Link
                href={lp(lang, `/blogs/${p.slug}`)}
                className="group grid gap-x-10 gap-y-2 py-7 md:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <div className="text-sm text-zinc-500">
                  <time dateTime={p.date}>{fmtDate(p.date, lang)}</time>
                  <span className="block">{t(lang, `${p.readingMinutes} min read`, `约 ${p.readingMinutes} 分钟`)}</span>
                </div>
                <div className="min-w-0 max-w-3xl">
                  <h2 className="text-xl font-semibold leading-snug tracking-tight text-zinc-50 group-hover:text-radeon-600">
                    {p.title}
                  </h2>
                  <p className="mt-2 text-base leading-7 text-zinc-400">{p.excerpt}</p>
                  {meta && <p className="mt-2 text-sm text-zinc-500">{meta}</p>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
