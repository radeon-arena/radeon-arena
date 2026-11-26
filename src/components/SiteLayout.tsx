import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FirstPartyAnalytics } from "@/components/FirstPartyAnalytics";
import { LangProvider } from "@/components/LangProvider";
import { HTML_LANG, type Lang } from "@/lib/i18n";

const META: Record<Lang, { title: string; description: string; og: string }> = {
  en: {
    title: "Radeon Arena - LLM Leaderboard",
    description:
      "LLM inference benchmarks measured on AMD Radeon GPUs (vLLM and llama.cpp on ROCm), and an A2A API for ROCm and local LLM support questions.",
    og: "LLM benchmark leaderboard for AMD Radeon GPUs",
  },
  zh: {
    title: "Radeon Arena - 大模型推理榜单",
    description:
      "在 AMD Radeon 显卡上实测的大模型推理性能（ROCm 上的 vLLM 和 llama.cpp），以及解答 ROCm 与本地大模型问题的 A2A 接口。",
    og: "AMD Radeon 显卡大模型推理榜单",
  },
};

export function siteMetadata(lang: Lang): Metadata {
  const m = META[lang];
  return {
    metadataBase: new URL("https://radeon-arena.com"),
    title: m.title,
    description: m.description,
    keywords: ["LLM", "benchmark", "AMD", "Radeon", "ROCm", "RDNA", "vLLM", "llama.cpp", "A2A", "API", "ROCm FAQ"],
    applicationName: "Radeon Arena",
    icons: { icon: "/icon.svg" },
    openGraph: {
      title: m.title,
      description: m.og,
      type: "website",
      url: lang === "zh" ? "https://radeon-arena.com/zh/" : "https://radeon-arena.com",
      locale: lang === "zh" ? "zh_CN" : "en_US",
    },
    twitter: { card: "summary", title: m.title, description: m.og },
  };
}

export function SiteLayout({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <html lang={HTML_LANG[lang]}>
      <body className="min-h-screen flex flex-col">
        <LangProvider lang={lang}>
          <FirstPartyAnalytics />
          <Header lang={lang} />
          <main className="flex-1">{children}</main>
          <Footer lang={lang} />
        </LangProvider>
      </body>
    </html>
  );
}
