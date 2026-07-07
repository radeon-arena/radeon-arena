"use client";

import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { UsersView } from "@/components/leaderboard/UsersView";
import { OrganizationsView } from "@/components/leaderboard/OrganizationsView";
import { CompareView } from "@/components/leaderboard/CompareView";
import { SubmitView } from "@/components/leaderboard/SubmitView";
import { HowToView } from "@/components/leaderboard/HowToView";
import { RecipesView } from "@/components/leaderboard/RecipesView";
import type { TabKey } from "@/lib/tabs";

const PAGE_COPY: Record<TabKey, { title: string; subtitle: string }> = {
  leaderboard: {
    title: "LLM Leaderboard",
    subtitle: "Performance rankings for LLMs running on AMD Radeon GPUs.",
  },
  recipes: {
    title: "Recipes",
    subtitle: "Pinned serve commands, model sources, runtime images, and measured result links.",
  },
  users: {
    title: "Users",
    subtitle: "Contributor rankings for submitted and verified benchmark runs.",
  },
  organizations: {
    title: "Organizations",
    subtitle: "Organization-level benchmark contributions and verified result coverage.",
  },
  compare: {
    title: "Compare Models",
    subtitle: "Compare model and runtime performance across available benchmark points.",
  },
  submit: {
    title: "Submit Recipe",
    subtitle: "Prepare a reproducible radeonrun recipe and measured result update.",
  },
  how: {
    title: "How to Benchmark",
    subtitle: "Reproduce the Radeon Arena benchmark methodology on AMD Radeon hardware.",
  },
};

export function LeaderboardShell({ hw, tab }: { hw: string; tab: TabKey }) {
  const copy = PAGE_COPY[tab];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-radeon-400">{copy.title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{copy.subtitle}</p>

      <div className="mt-6">
        {tab === "leaderboard" && <LeaderboardView hw={hw} />}
        {tab === "recipes" && <RecipesView hw={hw} />}
        {tab === "users" && <UsersView hw={hw} />}
        {tab === "organizations" && <OrganizationsView hw={hw} />}
        {tab === "compare" && <CompareView hw={hw} />}
        {tab === "submit" && <SubmitView hw={hw} />}
        {tab === "how" && <HowToView />}
      </div>
    </div>
  );
}
