import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HARDWARE, hwLabel } from "@/lib/hardware";
import { VISIBLE_TABS, isTab } from "@/lib/tabs";
import { LeaderboardShell } from "@/components/leaderboard/LeaderboardShell";

// Pre-render the known hardware roots; unknown first segments 404.
export function generateStaticParams() {
  return HARDWARE.flatMap((h) => [
    { hw: h.key, rest: [] },
    ...VISIBLE_TABS.map((t) => ({ hw: h.key, rest: [t.key] })),
  ]);
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { hw: string } }): Metadata {
  if (!HARDWARE.some((h) => h.key === params.hw)) return {};
  return {
    title: `${hwLabel(params.hw)} — LLM Leaderboard | Radeon Arena`,
    description: `LLM inference benchmarks on ${hwLabel(params.hw)} (AMD Radeon).`,
  };
}

// Routes: /strix, /strix/leaderboard, /strix/users, /r9700/compare, /w7900/...
export default function HardwarePage({ params }: { params: { hw: string; rest?: string[] } }) {
  if (!HARDWARE.some((h) => h.key === params.hw)) notFound();
  const tabKey = params.rest?.[0];
  const tab = isTab(tabKey) ? tabKey : "leaderboard";
  return <LeaderboardShell hw={params.hw} tab={tab} />;
}
