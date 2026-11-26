import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts, getPost, type BlogPost } from "@/lib/blog";
import { fmtDate } from "@/lib/format";
import { HARDWARE } from "@/lib/hardware";
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

const DEVICE_NAMES = HARDWARE.map((h) => h.short);
// Engine tags written by the generator; "vLLM (main)" is the upstream build
// used for DiffusionGemma.
const ENGINE_NAMES = ["vLLM", "vLLM (main)", "llama.cpp"];

// Generated posts are recognised by slug: engine-* and model-* come from
// scripts/gen-blog-posts.py; everything else is a hand-written article.
function splitPosts(posts: BlogPost[]) {
  const articles = posts.filter((p) => !/^(engine|model)-/.test(p.slug));
  const engines = posts.filter((p) => p.slug.startsWith("engine-"));
  const models = posts.filter((p) => p.slug.startsWith("model-"));
  return { articles, engines, models };
}

function joinNames(lang: Lang, names: string[]): string {
  return names.join(lang === "zh" ? "、" : ", ");
}

export function BlogIndex({ lang }: { lang: Lang }) {
  const { articles, engines, models } = splitPosts(allPosts(lang));
  const modelsDate = models[0]?.date;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50">{t(lang, "Blog", "博客")}</h1>
        <p className="mt-3 text-lg leading-8 text-zinc-400">
          {t(
            lang,
            "Engineering notes and benchmark write-ups for running LLMs on AMD Radeon hardware. Every number comes from our own measurements.",
            "在 AMD Radeon 硬件上跑大模型的工程笔记和跑分解读。文中数字都来自本站实测。",
          )}
        </p>
      </header>

      {articles.length === 0 && engines.length === 0 && models.length === 0 && (
        <p className="mt-12 border-t border-ink-700 pt-8 text-zinc-400">
          {t(lang, "No posts yet.", "还没有文章。")}{" "}
          <Link href={lp(lang, "/strix/leaderboard")} className="text-radeon-600 hover:underline">
            {t(lang, "Browse the leaderboard", "去看榜单")}
          </Link>
        </p>
      )}

      {/* Hand-written articles: the featured stories, one per row. */}
      {articles.length > 0 && (
        <section aria-labelledby="blog-articles" className="mt-12">
          <h2 id="blog-articles" className="sr-only">
            {t(lang, "Articles", "文章")}
          </h2>
          <ul>
            {articles.map((p) => (
              <li key={p.slug} className="border-t border-ink-700">
                <Link href={lp(lang, `/blogs/${p.slug}`)} className="group grid gap-x-12 gap-y-3 py-10 md:grid-cols-[12rem_minmax(0,1fr)]">
                  <div className="text-sm text-zinc-500">
                    <time dateTime={p.date}>{fmtDate(p.date, lang)}</time>
                    <span className="mt-1 block">{readTime(lang, p.readingMinutes)}</span>
                  </div>
                  <div className="max-w-3xl">
                    <h3 className="text-2xl font-semibold leading-snug tracking-tight text-zinc-50 group-hover:text-radeon-600 sm:text-3xl">
                      {p.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-zinc-400">{p.excerpt}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Engine round-ups: two side by side. */}
      {engines.length > 0 && (
        <section aria-labelledby="blog-engines" className="mt-6 border-t border-ink-700 pt-10">
          <h2 id="blog-engines" className="text-sm font-semibold text-zinc-300">
            {t(lang, "By engine", "按推理引擎")}
          </h2>
          <ul className="mt-6 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {engines.map((p) => (
              <li key={p.slug}>
                <Link href={lp(lang, `/blogs/${p.slug}`)} className="group block">
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-50 group-hover:text-radeon-600">{p.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">{p.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-model pages: a dense list, like a table of contents. */}
      {models.length > 0 && (
        <section aria-labelledby="blog-models" className="mt-14 border-t border-ink-700 pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="blog-models" className="text-sm font-semibold text-zinc-300">
              {t(lang, `By model (${models.length})`, `按模型（${models.length} 篇）`)}
            </h2>
            {modelsDate && (
              <p className="text-sm text-zinc-500">
                {t(lang, "Generated from the leaderboard data on ", "根据榜单数据生成，")}
                <time dateTime={modelsDate}>{fmtDate(modelsDate, lang)}</time>
              </p>
            )}
          </div>

          <div
            aria-hidden="true"
            className="mt-6 hidden grid-cols-[minmax(0,1fr)_14rem_8rem] gap-x-8 border-b border-ink-700 pb-2 text-xs text-zinc-500 md:grid"
          >
            <span>{t(lang, "Model", "模型")}</span>
            <span>{t(lang, "Hardware", "硬件")}</span>
            <span>{t(lang, "Engines", "引擎")}</span>
          </div>
          <ul className="md:mt-0 mt-6 border-t border-ink-700 md:border-t-0">
            {models.map((p) => {
              const name = p.tags[1] ?? p.title;
              const devices = p.tags.filter((tag) => DEVICE_NAMES.includes(tag));
              const runtimes = p.tags.filter((tag) => ENGINE_NAMES.includes(tag));
              return (
                <li key={p.slug} className="border-b border-ink-700">
                  <Link
                    href={lp(lang, `/blogs/${p.slug}`)}
                    className="group grid gap-x-8 gap-y-1 py-4 transition-colors hover:bg-ink-850 md:grid-cols-[minmax(0,1fr)_14rem_8rem] md:items-baseline"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-50 group-hover:text-radeon-600">{name}</h3>
                      <p className="mt-0.5 truncate text-sm text-zinc-500" title={p.excerpt}>
                        {p.excerpt}
                      </p>
                    </div>
                    <span className="text-sm text-zinc-400">{joinNames(lang, devices)}</span>
                    <span className="text-sm text-zinc-400">{joinNames(lang, runtimes)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
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
