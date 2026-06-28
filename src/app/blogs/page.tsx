import Link from "next/link";
import type { Metadata } from "next";
import { allPosts } from "@/lib/blog";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog - Radeon Arena",
  description:
    "Engineering notes, benchmark write-ups, and tuning logs for running LLMs on AMD Radeon hardware.",
};

export default function BlogsPage() {
  const posts = allPosts();
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="chip mb-6 border-radeon-700/50 text-radeon-300">Blog</div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
        Radeon <span className="text-radeon-500">Arena</span> Blog
      </h1>
      <p className="mt-4 text-lg text-zinc-400">
        Engineering notes, benchmark write-ups, and tuning logs for running LLMs on AMD Radeon hardware.
      </p>

      <div className="mt-10 space-y-4">
        {posts.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-sm text-zinc-400">
              No posts yet — write-ups land here only when their numbers come straight from this
              board&apos;s own measurements.
            </p>
            <Link href="/strix/leaderboard" className="btn-ghost mt-4 inline-block">
              Browse the leaderboard
            </Link>
          </div>
        )}
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blogs/${p.slug}`}
            className="group card block p-6 transition-colors hover:border-radeon-600"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <time dateTime={p.date}>{fmtDate(p.date)}</time>
              <span aria-hidden>·</span>
              <span>{p.readingMinutes} min read</span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">{p.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{p.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
            <span className="mt-4 inline-block text-sm text-radeon-400 group-hover:text-radeon-300">
              Read →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
