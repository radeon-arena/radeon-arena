import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts, getPost } from "@/lib/blog";
import { fmtDate } from "@/lib/format";

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: "Not found - Radeon Arena Blog" };
  return {
    title: `${post.title} - Radeon Arena Blog`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/blogs" className="inline-flex items-center gap-1 text-sm text-radeon-400 hover:text-radeon-300">
        <span aria-hidden>←</span> All posts
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <time dateTime={post.date}>{fmtDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-8">{post.content}</div>

      <footer className="mt-12 border-t border-ink-800 pt-6">
        <Link href="/strix/leaderboard" className="btn-ghost inline-block">
          Browse the leaderboard
        </Link>
      </footer>
    </article>
  );
}
