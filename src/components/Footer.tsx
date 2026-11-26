import Link from "next/link";
import { SITE, PROJECTS, API } from "@/lib/site";
import { lp, t, type Lang } from "@/lib/i18n";

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">{t(lang, "Benchmark Engines", "跑分用到的项目")}</h3>
            <ul className="space-y-2 text-sm">
              {Object.values(PROJECTS).map((p) => (
                <li key={p.name}>
                  <a href={p.url} className="text-zinc-400 hover:text-radeon-400">
                    {p.name}
                  </a>
                  <p className="text-xs text-zinc-600">{t(lang, p.short, p.shortZh)}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">{t(lang, "Community", "社区")}</h3>
            <p className="mb-3 text-sm text-zinc-500">
              {t(
                lang,
                "Built on open-source inference engines and the AMD ROCm platform.",
                "基于开源推理引擎和 AMD ROCm 平台。",
              )}
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href={SITE.developer} className="btn-ghost">{t(lang, "AMD Developer Community", "AMD 开发者社区")}</a>
              <a href={SITE.cloud} className="btn-ghost">Radeon Cloud</a>
              <a href={SITE.blog} className="btn-ghost">{t(lang, "ROCm Blog", "ROCm 博客")}</a>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">{t(lang, "Data", "数据")}</h3>
            <p className="text-sm text-zinc-500">
              {t(
                lang,
                "Benchmarks measured by RadeonArena on AMD RDNA hardware—Radeon 8060S (Strix Halo), Radeon AI PRO R9700 and Radeon PRO W7900. Real numbers, refreshed continuously.",
                "全部由 Radeon Arena 在 AMD RDNA 硬件上实测：Radeon 8060S（Strix Halo）、Radeon AI PRO R9700 和 Radeon PRO W7900。数据持续更新。",
              )}
            </p>
            <a href={lp(lang, "/strix/leaderboard")} className="mt-3 inline-block text-sm text-radeon-400 hover:text-radeon-300">
              {t(lang, "Browse the leaderboard →", "查看榜单 →")}
            </a>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">{t(lang, "Developers", "开发者")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={lp(lang, API.docs)} className="text-zinc-400 hover:text-radeon-400">{t(lang, "API Docs", "API 文档")}</Link></li>
              <li><a href={API.agentCard} className="text-zinc-400 hover:text-radeon-400">Agent Card</a></li>
              <li><a href={API.llmsTxt} className="text-zinc-400 hover:text-radeon-400">llms.txt</a></li>
              <li><a href={API.skillsRepo} className="text-zinc-400 hover:text-radeon-400">{t(lang, "Skills on GitHub", "GitHub 上的 Skills")}</a></li>
              <li><a href={API.mcpRepo} className="text-zinc-400 hover:text-radeon-400">{t(lang, "MCP tools on GitHub", "GitHub 上的 MCP 工具")}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-ink-800 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Radeon Arena. {t(lang, `${SITE.tagline}.`, `${SITE.taglineZh}。`)}
            <span className="ml-2 text-zinc-700">build {process.env.NEXT_PUBLIC_BUILD_TIME ?? "dev"}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={lp(lang, "/terms")} className="hover:text-radeon-400">{t(lang, "Terms", "服务条款")}</Link>
            <Link href={lp(lang, "/privacy")} className="hover:text-radeon-400">{t(lang, "Privacy", "隐私政策")}</Link>
            <Link href={lp(lang, "/data-policy")} className="hover:text-radeon-400">{t(lang, "Data Policy", "数据政策")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
