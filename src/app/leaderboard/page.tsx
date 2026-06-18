"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { UsersView } from "@/components/leaderboard/UsersView";
import { OrganizationsView } from "@/components/leaderboard/OrganizationsView";
import { CompareView } from "@/components/leaderboard/CompareView";
import { RecipeGeneratorView } from "@/components/leaderboard/RecipeGeneratorView";
import { HowToView } from "@/components/leaderboard/HowToView";

const TABS = [
  { key: "leaderboard", label: "LLM Leaderboard" },
  { key: "users", label: "Users" },
  { key: "organizations", label: "Organizations" },
  { key: "compare", label: "Compare Models" },
  { key: "recipe", label: "Recipe Generator" },
  { key: "how", label: "How to Benchmark" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function LeaderboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("tab") as TabKey) ?? "leaderboard";
  const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === initial) ? initial : "leaderboard");

  function select(k: TabKey) {
    setTab(k);
    const q = new URLSearchParams(Array.from(params.entries()));
    if (k === "leaderboard") q.delete("tab");
    else q.set("tab", k);
    router.push(`/leaderboard${q.toString() ? `?${q.toString()}` : ""}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-2 text-xs text-zinc-500">
        Benchmarks run with: ROCm vLLM · llama.cpp · AMD ROCm
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">LLM Leaderboard</h1>
      <p className="mt-1 text-sm text-zinc-400">Performance rankings for LLMs running on AMD Radeon GPUs.</p>

      <div className="thin-scroll mt-6 flex gap-1 overflow-x-auto border-b border-ink-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => select(t.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === t.key
                ? "border-radeon-500 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "leaderboard" && <LeaderboardView />}
        {tab === "users" && <UsersView />}
        {tab === "organizations" && <OrganizationsView />}
        {tab === "compare" && <CompareView />}
        {tab === "recipe" && <RecipeGeneratorView />}
        {tab === "how" && <HowToView />}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-zinc-500">Loading…</p>}>
      <LeaderboardInner />
    </Suspense>
  );
}
