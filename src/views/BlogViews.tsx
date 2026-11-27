import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts, getPost, type BlogPost } from "@/lib/blog";
import { fmtDate } from "@/lib/format";
import { HARDWARE } from "@/lib/hardware";
import { BlogList, type BlogListItem } from "@/components/BlogList";
import { alternates, lp, t, type Lang } from "@/lib/i18n";

// Shared by /blog (English) and /zh/blog (Chinese). Both languages have the
// same posts under the same slugs.

export function blogIndexMetadata(lang: Lang): Metadata {
  return {
    title: t(lang, "Blog - Radeon Arena", "博客 - Radeon Arena"),
    description: t(
      lang,
      "Step-by-step guides and measured results for running LLMs on AMD Radeon: copy the commands and go.",
      "在 AMD Radeon 上部署大模型的教程和实测：复制命令就能跑。",
    ),
  };
}

function readTime(lang: Lang, minutes: number): string {
  return t(lang, `${minutes} min read`, `约 ${minutes} 分钟读完`);
}

const DEVICE_NAMES = HARDWARE.map((h) => h.short);
// Engine tags written by the generator; "vLLM (main)" is the upstream build
// used for DiffusionGemma.
const ENGINE_NAMES = ["vLLM", "vLLM (main)", "llama.cpp"];

function toListItem(p: BlogPost): BlogListItem {
  return {
    slug: p.slug,
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
    readingMinutes: p.readingMinutes,
    hardware: p.tags.filter((tag) => DEVICE_NAMES.includes(tag)),
    engines: p.tags.filter((tag) => ENGINE_NAMES.includes(tag)),
  };
}

export function BlogIndex({ lang }: { lang: Lang }) {
  const posts = allPosts(lang).map(toListItem);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50">{t(lang, "Blog", "博客")}</h1>
        <p className="mt-3 text-lg leading-8 text-zinc-400">
          {t(
            lang,
            "How to run popular LLMs on AMD Radeon, with commands you can paste. Every number comes from our own measurements.",
            "在 AMD Radeon 上部署热门大模型的教程，命令复制就能跑。文中数字都来自本站实测。",
          )}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-12 border-t border-ink-700 pt-8 text-zinc-400">
          {t(lang, "No posts yet.", "还没有文章。")}{" "}
          <Link href={lp(lang, "/strix/leaderboard")} className="text-radeon-600 hover:underline">
            {t(lang, "Browse the leaderboard", "去看榜单")}
          </Link>
        </p>
      ) : (
        <BlogList lang={lang} posts={posts} hardware={DEVICE_NAMES} />
      )}
    </div>
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
    alternates: alternates(lang, `/blog/${post.slug}`),
    openGraph: { title: post.title, description: post.excerpt, type: "article", locale: lang === "zh" ? "zh_CN" : "en_US" },
    twitter: { card: "summary", title: post.title, description: post.excerpt },
  };
}

export function BlogPostView({ lang, slug }: { lang: Lang; slug: string }) {
  const post = getPost(slug, lang);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href={lp(lang, "/blog")} className="inline-flex items-center gap-1 text-sm text-radeon-400 hover:text-radeon-300">
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
