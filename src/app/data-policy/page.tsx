import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Policy - Radeon Arena",
  description: "Benchmark data policy for Radeon Arena.",
};

export default function DataPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-radeon-400 hover:text-radeon-300">← Back to home</Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">Data Policy</h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: 2026-06-30</p>

      <div className="card mt-8 space-y-6 p-7 text-sm leading-7 text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Source of truth</h2>
          <p className="mt-2 text-zinc-400">
            The benchmark source of truth is the public radeonrun repository: recipes live under
            <code>recipes/*.yaml</code>, measured results live under <code>results/&lt;device&gt;/*.json</code>,
            and the website reads the generated <code>results/bundle.json</code> as a static data file.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Reproducibility requirements</h2>
          <p className="mt-2 text-zinc-400">
            A result should be tied to a recipe, benchmark profile, model source, runtime/container image,
            image tag or digest, hardware label, and measured output. Moving tags such as
            <code>:latest</code> should not be used as the identity of a leaderboard result.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Benchmark scope</h2>
          <p className="mt-2 text-zinc-400">
            The public board focuses on AMD Radeon / RDNA hardware. CDNA/Instinct and NVIDIA results are
            outside the Radeon Arena board unless a future policy explicitly adds a separate view.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Incomplete or failed runs</h2>
          <p className="mt-2 text-zinc-400">
            Incomplete runs, failed runs, or results that do not cover the expected benchmark profile
            should not be silently treated as complete leaderboard entries. They may be rejected,
            rerun, or documented separately until the missing measurements are resolved.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">No fabricated data</h2>
          <p className="mt-2 text-zinc-400">
            Do not submit placeholder numbers, hand-written guesses, or results copied from unrelated
            systems as if they were produced by the stated recipe. If a result came from a different
            setup, it must be clearly represented as such or kept out of the board.
          </p>
        </section>
      </div>
    </section>
  );
}
