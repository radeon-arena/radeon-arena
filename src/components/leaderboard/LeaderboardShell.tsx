"use client";

import Link from "next/link";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { UsersView } from "@/components/leaderboard/UsersView";
import { OrganizationsView } from "@/components/leaderboard/OrganizationsView";
import { CompareView } from "@/components/leaderboard/CompareView";
import { RecipeGeneratorView } from "@/components/leaderboard/RecipeGeneratorView";
import { SubmitView } from "@/components/leaderboard/SubmitView";
import { HowToView } from "@/components/leaderboard/HowToView";
import { PROJECTS } from "@/lib/site";
import { HARDWARE } from "@/lib/hardware";
import { VISIBLE_TABS, type TabKey } from "@/lib/tabs";

function TabIcon({ k }: { k: TabKey }) {
  const common = { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  switch (k) {
    case "leaderboard":
      return <svg {...common}><path d="M5 21V10M12 21V4M19 21v-7" strokeLinecap="round" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" strokeLinecap="round" /></svg>;
    case "organizations":
      return <svg {...common}><rect x="4" y="4" width="7" height="16" rx="1" /><rect x="13" y="9" width="7" height="11" rx="1" /></svg>;
    case "compare":
      return <svg {...common}><path d="M9 4v16M15 4v16M4 9h5M15 15h5" strokeLinecap="round" /></svg>;
    case "recipe":
      return <svg {...common}><path d="M12 3v6m0 0 3-3m-3 3L9 6M5 13h14l-1 8H6l-1-8Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "submit":
      return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "how":
      return <svg {...common}><path d="m7 8-4 4 4 4M17 8l4 4-4 4M13 5l-2 14" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
}

export function LeaderboardShell({ hw, tab }: { hw: string; tab: TabKey }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Powered-by bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link href="/" className="inline-flex items-center gap-1 text-radeon-300 hover:text-radeon-200">
          <span aria-hidden>←</span> Back to home
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-500">
          <span>Powered by:</span>
          {Object.values(PROJECTS).map((p) => (
            <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-radeon-300 hover:text-radeon-200">
              {p.name}
              <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5h10v10M19 5 5 19" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-radeon-400">LLM Leaderboard</h1>
      <p className="mt-1 text-sm text-zinc-400">Performance rankings for LLMs running on AMD Radeon GPUs.</p>

      {/* Hardware nav — scopes every tab below to the selected GPU */}
      <div className="thin-scroll mt-5 flex gap-2 overflow-x-auto pb-1">
        {HARDWARE.map((h) => {
          const active = hw === h.key;
          if (h.disabled) {
            return (
              <div
                key={h.key}
                aria-disabled="true"
                title="No benchmarks yet — coming soon"
                className="flex min-w-[150px] cursor-not-allowed flex-col rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-2.5 text-left opacity-50"
              >
                <span className="text-sm font-semibold text-zinc-500">{h.label}</span>
                <span className="text-[11px] text-zinc-600">{h.sub} · soon</span>
              </div>
            );
          }
          return (
            <Link
              key={h.key}
              href={`/${h.key}/${tab}`}
              scroll={false}
              className={`flex min-w-[150px] flex-col rounded-xl border px-4 py-2.5 text-left transition-colors ${
                active ? "border-radeon-600 bg-radeon-500/10" : "border-ink-700 hover:bg-ink-800"
              }`}
            >
              <span className={`text-sm font-semibold ${active ? "text-radeon-200" : "text-zinc-200"}`}>{h.label}</span>
              <span className="text-[11px] text-zinc-500">{h.sub}</span>
            </Link>
          );
        })}
      </div>

      {/* Tab nav */}
      <div className="thin-scroll mt-4 flex gap-2 overflow-x-auto border-t border-ink-800 pt-4 pb-1">
        {VISIBLE_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/${hw}/${t.key}`}
            scroll={false}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-radeon-600 bg-radeon-500/10 text-radeon-200"
                : "border-ink-700 text-zinc-400 hover:bg-ink-800 hover:text-zinc-200"
            }`}
          >
            <TabIcon k={t.key} />
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "leaderboard" && <LeaderboardView hw={hw} />}
        {tab === "users" && <UsersView hw={hw} />}
        {tab === "organizations" && <OrganizationsView hw={hw} />}
        {tab === "compare" && <CompareView hw={hw} />}
        {tab === "recipe" && <RecipeGeneratorView />}
        {tab === "submit" && <SubmitView hw={hw} />}
        {tab === "how" && <HowToView />}
      </div>
    </div>
  );
}
