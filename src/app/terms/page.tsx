import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms - Radeon Arena",
  description: "Terms of use for Radeon Arena.",
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-radeon-400 hover:text-radeon-300">← Back to home</Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">Terms of Use</h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: 2026-06-30</p>

      <div className="card mt-8 space-y-6 p-7 text-sm leading-7 text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Community benchmark information</h2>
          <p className="mt-2 text-zinc-400">
            Radeon Arena is a community-driven benchmark display site for AMD Radeon hardware. Results are
            derived from public recipe and result files in the radeonrun repository. The site is provided
            for technical comparison and reproducibility work, not as a warranty or certification of any
            product, workload, driver, model, or service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Contributions</h2>
          <p className="mt-2 text-zinc-400">
            Contributions are handled through GitHub pull requests. By submitting recipes, result files,
            documentation, or metadata, you represent that you have the right to contribute them and that
            the project may display, copy, transform, and redistribute that material as part of the public
            benchmark dataset and website.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Data quality</h2>
          <p className="mt-2 text-zinc-400">
            We aim to show real, reproducible results. Benchmark numbers may still vary with hardware,
            firmware, drivers, model revisions, container images, runtime commits, and run conditions. Do
            not treat any result as guaranteed performance for your environment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Acceptable use</h2>
          <p className="mt-2 text-zinc-400">
            Do not submit malicious content, fabricated data, private credentials, unlawful material, or
            content that infringes third-party rights. Maintainers may reject, remove, or annotate content
            that does not meet the project&apos;s reproducibility and transparency standards.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">No warranty</h2>
          <p className="mt-2 text-zinc-400">
            The site and dataset are provided as-is, without warranties of accuracy, availability,
            merchantability, fitness for a particular purpose, or non-infringement. The project may change
            or remove pages, datasets, links, or features at any time.
          </p>
        </section>
      </div>
    </section>
  );
}
