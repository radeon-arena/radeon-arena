import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HARDWARE, hwLabel } from "@/lib/hardware";
import { VISIBLE_TABS, isTab } from "@/lib/tabs";
import { alternates, t, type Lang } from "@/lib/i18n";
import { LeaderboardShell } from "@/components/leaderboard/LeaderboardShell";

type Params = { hw: string; rest?: string[] };

// Pre-render the known hardware roots; unknown first segments 404.
export function hardwareParams() {
  return HARDWARE.flatMap((h) => [
    { hw: h.key, rest: [] },
    ...VISIBLE_TABS.map((tab) => ({ hw: h.key, rest: [tab.key] })),
  ]);
}

export function hardwareMetadata(lang: Lang, params: Params): Metadata {
  if (!HARDWARE.some((h) => h.key === params.hw)) return {};
  const label = hwLabel(params.hw);
  const path = `/${params.hw}${params.rest?.[0] ? `/${params.rest[0]}` : ""}`;
  return {
    title: ({
      recipes: t(lang, `${label} — Recipes | Radeon Arena`, `${label} 部署配方 | Radeon Arena`),
      submit: t(lang, `${label} — Submit Recipe | Radeon Arena`, `${label} 提交配方 | Radeon Arena`),
    } as Record<string, string>)[params.rest?.[0] ?? ""] ?? t(lang, `${label} — LLM Leaderboard | Radeon Arena`, `${label} 大模型推理榜单 | Radeon Arena`),
    description: t(lang, `LLM inference benchmarks on ${label} (AMD Radeon).`, `${label}（AMD Radeon）上实测的大模型推理性能。`),
    alternates: alternates(lang, path),
  };
}

// Routes: /strix, /strix/leaderboard, /strix/recipes, /strix/submit, /w7900/... (and /zh/...)
export function HardwarePage({ lang, params }: { lang: Lang; params: Params }) {
  if (!HARDWARE.some((h) => h.key === params.hw)) notFound();
  const tabKey = params.rest?.[0];
  const tab = isTab(tabKey) ? tabKey : "leaderboard";
  return <LeaderboardShell hw={params.hw} tab={tab} lang={lang} />;
}
