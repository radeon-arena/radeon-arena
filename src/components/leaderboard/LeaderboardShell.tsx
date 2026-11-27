"use client";

import Link from "next/link";
import { HARDWARE, hwLabel } from "@/lib/hardware";
import { lp, t } from "@/lib/i18n";
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

const SEG_BASE = "inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm transition-colors";
const SEG_ACTIVE = "bg-white font-semibold text-radeon-600 shadow-sm";
const SEG_IDLE = "text-zinc-300 hover:text-zinc-50";

// Switches the GPU while staying on the same tab (leaderboard, recipes, ...).
function HardwareSwitch({ hw, tab, lang }: { hw: string; tab: TabKey; lang: Lang }) {
  return (
    <div
      role="group"
      aria-label={t(lang, "GPU", "显卡")}
      className="flex w-fit shrink-0 items-center gap-0.5 rounded-lg bg-ink-800 p-0.5"
    >
      {HARDWARE.map((h) =>
        h.disabled ? (
          <span
            key={h.key}
            title={`${h.label} — ${t(lang, "coming soon", "即将上线")}`}
            aria-disabled="true"
            className={`${SEG_BASE} cursor-not-allowed text-zinc-500`}
          >
            {h.short}
          </span>
        ) : (
          <Link
            key={h.key}
            href={lp(lang, `/${h.key}/${tab}`)}
            title={h.label}
            aria-current={hw === h.key ? "page" : undefined}
            className={`${SEG_BASE} ${hw === h.key ? SEG_ACTIVE : SEG_IDLE}`}
          >
            {h.short}
          </Link>
        ),
      )}
    </div>
  );
}

export function LeaderboardShell({ hw, tab, lang }: { hw: string; tab: TabKey; lang: Lang }) {
  const copy = PAGE_COPY[lang][tab];
  // 中文榜单标题写明是哪款显卡，避免只看到“大模型推理榜单”不知道是哪一块卡的数据
  const title = lang === "zh" && tab === "leaderboard" ? `${hwLabel(hw)} 推理性能榜单` : copy.title;
  const subtitle = lang === "zh" && tab === "leaderboard" ? `大模型在 ${hwLabel(hw)} 上的实测推理速度，按模型、引擎和量化排序。` : copy.subtitle;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-radeon-400">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>
        <HardwareSwitch hw={hw} tab={tab} lang={lang} />
      </div>

      <div className="mt-6">
        {tab === "leaderboard" && <LeaderboardView hw={hw} />}
        {tab === "recipes" && <RecipesView hw={hw} />}
        {tab === "users" && <UsersView hw={hw} />}
        {tab === "submit" && <SubmitView hw={hw} />}
      </div>
    </div>
  );
}
