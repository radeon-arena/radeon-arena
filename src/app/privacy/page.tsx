import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy - Radeon Arena",
  description: "Privacy notice for Radeon Arena.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-radeon-400 hover:text-radeon-300">← Back to home</Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">Privacy</h1>
      <p className="mt-3 text-sm text-zinc-500">Last updated: 2026-06-30</p>

      <div className="card mt-8 space-y-6 p-7 text-sm leading-7 text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">No accounts or login</h2>
          <p className="mt-2 text-zinc-400">
            Radeon Arena is a static website. We do not run a login system, store user accounts, set
            application cookies, or collect account credentials on this site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Static hosting and third-party requests</h2>
          <p className="mt-2 text-zinc-400">
            The site is hosted on GitHub Pages and may be served through Cloudflare DNS/CDN. Your browser
            also loads static benchmark data from this site&apos;s <code>/data/bundle.json</code>, which is
            generated from the public radeonrun repository. External links, including GitHub, Hugging
            Face, ROCm, and other community resources, are governed by those services&apos; own policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">GitHub contributions</h2>
          <p className="mt-2 text-zinc-400">
            Submitting recipes or benchmark results happens on GitHub through pull requests and issues.
            GitHub account information, commit metadata, comments, and review activity are processed by
            GitHub and are public according to GitHub&apos;s platform behavior and policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Analytics</h2>
          <p className="mt-2 text-zinc-400">
            We do not currently embed a dedicated analytics script in the site. Hosting and DNS providers
            may retain standard operational logs, such as request metadata needed for security,
            reliability, and abuse prevention.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Changes</h2>
          <p className="mt-2 text-zinc-400">
            If the site adds analytics, accounts, forms, or other data collection features later, this
            notice should be updated before or alongside that change.
          </p>
        </section>
      </div>
    </section>
  );
}
