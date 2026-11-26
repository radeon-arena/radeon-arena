"use client";

import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { UsersView } from "@/components/leaderboard/UsersView";
import { SubmitView } from "@/components/leaderboard/SubmitView";
import { RecipesView } from "@/components/leaderboard/RecipesView";
import type { TabKey } from "@/lib/tabs";
import type { Lang } from "@/lib/i18n";

const PAGE_COPY: Record<Lang, Record<TabKey, { title: string; subtitle: string }>> = {
  en: {
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
  submit: {
    title: "Submit Recipe",
    subtitle: "Prepare a reproducible radeonrun recipe and measured result update.",
  },
  },
  zh: {
    leaderboard: { title: "大模型推理榜单", subtitle: "大模型在 AMD Radeon 显卡上的推理性能排名。" },
    recipes: { title: "部署配方", subtitle: "固定版本的启动命令、模型来源、引擎镜像和实测结果链接。" },
    users: { title: "贡献者", subtitle: "按提交及已验证的跑分统计贡献者排名。" },
    submit: { title: "提交配方", subtitle: "准备一份可复现的 radeonrun 配方和实测结果更新。" },
  },
};

export function LeaderboardShell({ hw, tab, lang }: { hw: string; tab: TabKey; lang: Lang }) {
  const copy = PAGE_COPY[lang][tab];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-radeon-400">{copy.title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{copy.subtitle}</p>

      <div className="mt-6">
        {tab === "leaderboard" && <LeaderboardView hw={hw} />}
        {tab === "recipes" && <RecipesView hw={hw} />}
        {tab === "users" && <UsersView hw={hw} />}
        {tab === "submit" && <SubmitView hw={hw} />}
      </div>
    </div>
  );
}
