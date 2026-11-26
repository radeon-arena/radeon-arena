import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { SITE, PROJECTS, API } from "@/lib/site";
import { lp, t, type Lang } from "@/lib/i18n";

const FEATURES = [
  {
    title: ["Real Performance", "实测性能"],
    body: [
      "Measured benchmarks from RadeonArena automated runs on AMD RDNA hardware — Radeon 8060S (Strix Halo), Radeon AI PRO R9700 and Radeon PRO W7900.",
      "全部来自 Radeon Arena 在 AMD RDNA 硬件上的自动化实测：Radeon 8060S（Strix Halo）、Radeon AI PRO R9700 和 Radeon PRO W7900。",
    ],
  },
  {
    title: ["Multiple Runtimes", "两种推理引擎"],
    body: [
      "Compare vLLM and llama.cpp across ROCm/HIP and Vulkan backends.",
      "对比 vLLM 和 llama.cpp 在 ROCm/HIP 与 Vulkan 后端上的表现。",
    ],
  },
  {
    title: ["Full Transparency", "可复现"],
    body: [
      "View complete recipes, engine versions, quantization, and detailed benchmark results.",
      "每条结果都附完整配方、引擎版本、量化格式和逐项测试数据。",
    ],
  },
] as const;

export function HomeView({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  return (
    <div>
      <div className="border-b border-ink-800 bg-ink-950/50">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs text-zinc-500 sm:px-6">
          {t(lang, "Benchmarks run with:", "跑分用到：")}{" "}
          <a href={PROJECTS.vllmDocker.url} className="text-zinc-400 hover:text-radeon-400">{PROJECTS.vllmDocker.name}</a> ·{" "}
          <a href={PROJECTS.radeonrun.url} className="text-zinc-400 hover:text-radeon-400">{PROJECTS.radeonrun.name}</a> ·{" "}
          <a href={SITE.blog} className="text-zinc-400 hover:text-radeon-400">{t(lang, "ROCm Blog", "ROCm 博客")}</a> ·{" "}
          <a href={PROJECTS.benchy.url} className="text-zinc-400 hover:text-radeon-400">{PROJECTS.benchy.name}</a>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Radeon <span className="text-radeon-500">Arena</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">{t(lang, SITE.description, SITE.descriptionZh)}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={lp(lang, "/strix/leaderboard")} className="btn-primary">{t(lang, "View Leaderboard", "查看榜单")}</Link>
          <Link href={lp(lang, "/strix/recipes")} className="btn-ghost">{t(lang, "Browse Recipes", "浏览部署配方")}</Link>
          <Link href={lp(lang, "/strix/submit")} className="btn-ghost">{t(lang, "Submit Benchmark", "提交跑分")}</Link>
        </div>
      </section>

      <Carousel />

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title[0]} className="card p-6">
              <h3 className="mb-2 font-semibold text-zinc-100">{f.title[zh ? 1 : 0]}</h3>
              <p className="text-sm text-zinc-400">{f.body[zh ? 1 : 0]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Support agent API */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-4 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">{t(lang, "AMD GPU Support Agent API", "AMD GPU 支持助手 API")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              {t(
                lang,
                "Let your AI agent ask about ROCm, drivers and local LLMs on AMD GPUs over A2A, with structured JSON in and out. Answers cite the official AMD ROCm community support FAQ. Free with an email code or GitHub sign-in.",
                "让你的 AI Agent 通过 A2A 协议询问 AMD 显卡上的 ROCm、驱动和本地大模型问题，输入输出都是结构化 JSON。回答会注明出处，引用 AMD 官方 ROCm 社区支持 FAQ。用邮箱验证码或 GitHub 登录即可免费使用。",
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={lp(lang, API.docs)} className="btn-primary">{t(lang, "Read the API docs", "阅读 API 文档")}</Link>
            <a href={API.agentCard} className="btn-ghost">Agent Card</a>
          </div>
        </div>
      </section>

      {/* Open-source engines that produced the data */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-zinc-100">{t(lang, "Benchmark Engines", "跑分用到的项目")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {t(
              lang,
              "The numbers on this leaderboard were produced by these open-source inference engines running on AMD ROCm hardware. (The leaderboard itself only collects and displays their results.)",
              "榜单上的数字由这些开源项目在 AMD ROCm 硬件上跑出来。网站本身只收集和展示结果。",
            )}
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {Object.values(PROJECTS).map((p) => (
              <div key={p.name} className="rounded-lg border border-ink-700 bg-ink-850 p-5">
                <h3 className="font-medium text-zinc-100">{p.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{t(lang, p.blurb, p.blurbZh)}</p>
                <a href={p.url} className="mt-3 inline-block text-sm text-radeon-400 hover:text-radeon-300">
                  {t(lang, "View on GitHub →", "在 GitHub 上查看 →")}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical blog */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-4 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">{t(lang, "Technical Blog", "技术博客")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              {t(
                lang,
                "Articles and benchmarking notes covering reproducibility, runtime tuning, and practical performance investigations from the community.",
                "AMD ROCm 博客上关于可复现性、引擎调优和实际性能排查的文章与跑分笔记。",
              )}
            </p>
          </div>
          <a href={SITE.blog} className="btn-primary shrink-0">{t(lang, "Visit Technical Blog", "前往技术博客")}</a>
        </div>
      </section>
    </div>
  );
}
