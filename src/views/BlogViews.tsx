import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts, getPost } from "@/lib/blog";
import { fmtDate } from "@/lib/format";
import { alternates, lp, t, type Lang } from "@/lib/i18n";

// Shared by /blogs (English) and /zh/blogs (Chinese). Both languages have the
// same posts under the same slugs.

export function blogIndexMetadata(lang: Lang): Metadata {
  return {
    title: t(lang, "Blog - Radeon Arena", "博客 - Radeon Arena"),
    description: t(
      lang,
      "Engineering notes, benchmark write-ups, and tuning logs for running LLMs on AMD Radeon hardware.",
      "在 AMD Radeon 硬件上跑大模型的工程笔记、跑分解读和调优记录。",
    ),
  };
}

function readTime(lang: Lang, minutes: number): string {
  return t(lang, `${minutes} min read`, `约 ${minutes} 分钟读完`);
}

export function BlogIndex({ lang }: { lang: Lang }) {
  const posts = allPosts(lang);
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="chip mb-6 border-radeon-700/50 text-radeon-300">{t(lang, "Blog", "博客")}</div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
        Radeon <span className="text-radeon-500">Arena</span> {t(lang, "Blog", "博客")}
      </h1>
      <p className="mt-4 text-lg text-zinc-400">
        {t(
          lang,
          "Engineering notes, benchmark write-ups, and tuning logs for running LLMs on AMD Radeon hardware.",
          "在 AMD Radeon 硬件上跑大模型的工程笔记、跑分解读和调优记录。",
        )}
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {posts.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-sm text-zinc-400">
              {t(
                lang,
                "No posts yet — write-ups land here only when their numbers come from our own measurements.",
                "还没有文章。只有数字全部来自我们自己实测的文章才会发在这里。",
              )}
            </p>
            <Link href={lp(lang, "/strix/leaderboard")} className="btn-ghost mt-4 inline-block">
              {t(lang, "Browse the leaderboard", "去看榜单")}
            </Link>
          </div>
        )}
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={lp(lang, `/blogs/${p.slug}`)}
            className="group card block p-6 transition-colors hover:border-radeon-600"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <time dateTime={p.date}>{fmtDate(p.date, lang)}</time>
              <span aria-hidden>·</span>
              <span>{readTime(lang, p.readingMinutes)}</span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">{p.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{p.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
            <span className="mt-4 inline-block text-sm text-radeon-400 group-hover:text-radeon-300">
              {t(lang, "Read →", "阅读 →")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function blogPostParams() {
  return allPosts("en").map((p) => ({ slug: p.slug }));
}

export function blogPostMetadata(lang: Lang, slug: string): Metadata {
  const post = getPost(slug, lang);
  if (!post) return { title: t(lang, "Not found - Radeon Arena Blog", "未找到 - Radeon Arena 博客") };
  return {
    title: `${post.title} - ${t(lang, "Radeon Arena Blog", "Radeon Arena 博客")}`,
    description: post.excerpt,
    alternates: alternates(lang, `/blogs/${post.slug}`),
    openGraph: { title: post.title, description: post.excerpt, type: "article", locale: lang === "zh" ? "zh_CN" : "en_US" },
    twitter: { card: "summary", title: post.title, description: post.excerpt },
  };
}

export function BlogPostView({ lang, slug }: { lang: Lang; slug: string }) {
  const post = getPost(slug, lang);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href={lp(lang, "/blogs")} className="inline-flex items-center gap-1 text-sm text-radeon-400 hover:text-radeon-300">
        <span aria-hidden>←</span> {t(lang, "All posts", "全部文章")}
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <time dateTime={post.date}>{fmtDate(post.date, lang)}</time>
          <span aria-hidden>·</span>
          <span>{readTime(lang, post.readingMinutes)}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-8">{post.content}</div>

      <footer className="mt-12 border-t border-ink-800 pt-6">
        <Link href={lp(lang, "/strix/leaderboard")} className="btn-ghost inline-block">
          {t(lang, "Browse the leaderboard", "去看榜单")}
        </Link>
      </footer>
    </article>
  );
}
