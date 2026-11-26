import Link from "next/link";
import type { Metadata } from "next";
import { lp, t, type Lang } from "@/lib/i18n";

// nginx serves this page, with status 404, for any unknown path: the Chinese
// one under /zh, the English one elsewhere. It is never linked or indexed.
export function notFoundMetadata(lang: Lang): Metadata {
  return {
    title: t(lang, "Page not found - Radeon Arena", "页面不存在 - Radeon Arena"),
    robots: { index: false, follow: true },
  };
}

export function NotFoundView({ lang }: { lang: Lang }) {
  const links = [
    { href: lp(lang, "/"), label: t(lang, "Home", "首页") },
    { href: lp(lang, "/strix/leaderboard"), label: t(lang, "Leaderboard", "榜单") },
    { href: lp(lang, "/docs"), label: t(lang, "API Docs", "API 文档") },
    { href: lp(lang, "/blogs"), label: t(lang, "Blog", "博客") },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-sm text-radeon-400">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
        {t(lang, "Page not found", "页面不存在")}
      </h1>
      <p className="mt-4 text-zinc-400">
        {t(lang, "The address may be mistyped, or the page has moved.", "地址可能输错了，或者页面已经移走。")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="btn-ghost">
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
