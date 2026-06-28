import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Radeon Arena",
  description:
    "Engineering notes, benchmark write-ups, and tuning logs for running LLMs on AMD Radeon hardware.",
};

export default function BlogsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="chip mb-6 border-radeon-700/50 text-radeon-300">Blog</div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
        Radeon <span className="text-radeon-500">Arena</span> Blog
      </h1>
      <p className="mt-4 text-lg text-zinc-400">
        Engineering notes, benchmark write-ups, and tuning logs for running LLMs on AMD Radeon
        hardware.
      </p>

      <div className="mt-10 rounded-xl border border-ink-800 bg-ink-900/40 p-8 text-center">
        <p className="text-sm text-zinc-400">Posts are coming soon.</p>
        <Link href="/strix/leaderboard" className="btn-ghost mt-4 inline-block">
          Browse the leaderboard
        </Link>
      </div>
    </section>
  );
}
