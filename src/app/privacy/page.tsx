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
      <p className="mt-3 text-sm text-zinc-500">Last updated: 2026-10-26</p>

      <div className="card mt-8 space-y-6 p-7 text-sm leading-7 text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Accounts and sign-in</h2>
          <p className="mt-2 text-zinc-400">
            Signing in is optional. GitHub sign-in is handled by Agent Tools and returns a short-lived,
            one-use identity assertion to Radeon Arena; Radeon Arena never receives your GitHub access
            token. If email-code sign-in is enabled, the code is single-use and expires after 10 minutes.
            We store a display name, stable provider identifier, verified email when supplied, avatar URL,
            role, account status, and login timestamps.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Sessions, devices, and deployment history</h2>
          <p className="mt-2 text-zinc-400">
            Web session and device tokens are random values stored only as hashes. Web sessions use a
            Secure, HttpOnly, SameSite=Lax cookie. Device records contain an install identifier, label,
            creation and last-use times, and revocation state. When you authorize a device, you can link
            that install&apos;s Radeon Arena deployment sessions, machine profile, requested task, generated
            plan, result status, and troubleshooting events to your account. IP addresses are reduced to
            an IPv4 /24 or IPv6 /48 prefix for abuse prevention.
          </p>
          <p className="mt-2 text-zinc-400">
            The Account page lets you export your account data, revoke devices, and delete your account.
            Deleting an account removes its linked deployment sessions and device credentials and returns
            the local install to anonymous use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Static hosting and third-party requests</h2>
          <p className="mt-2 text-zinc-400">
            The site is served as a static website through Cloudflare and an nginx origin. Your browser
            loads static benchmark data from this site&apos;s <code>/data/bundle.json</code>, which is
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
          <h2 className="text-lg font-semibold text-zinc-100">Retention and changes</h2>
          <p className="mt-2 text-zinc-400">
            Web sessions expire after 30 days of inactivity and device credentials after 90 days without
            use. Operational and audit records are retained only as needed for security and support. We
            will update this notice before or alongside material changes to account data collection.
          </p>
        </section>
      </div>
    </section>
  );
}
