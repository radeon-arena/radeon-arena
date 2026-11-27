import Link from "next/link";
import type { Metadata } from "next";
import { lp, t, type Lang } from "@/lib/i18n";

// Product page for Radeon Local Helper, the Windows app that deploys local
// LLMs through a chat with the Radeon Arena support agent. Shared by
// /local-helper and /zh/local-helper.

// The installer is uploaded next to the static site under /downloads/. Update
// these three values together with the file.
export const HELPER_INSTALLER = {
  version: "0.1.0",
  file: "RadeonLocalHelper-Setup-0.1.0.exe",
  sizeMB: "4.4",
  sha256: "3e332a0971bf80e4a2d6549264c83873428425af0df21b99639bf75c1da7a4d1",
};

export function localHelperMetadata(lang: Lang): Metadata {
  return {
    title: t(lang, "Radeon Local Helper - Radeon Arena", "Radeon 本地助手 - Radeon Arena"),
    description: t(
      lang,
      "A Windows app that deploys local LLMs on AMD GPUs through a chat: it recommends a framework and model, runs each step on your PC after you confirm, and ends with a local OpenAI-compatible endpoint.",
      "在 Windows 上用对话部署本地大模型：推荐框架和模型，经你确认后在本机逐步执行，最后得到本机 OpenAI 兼容地址。",
    ),
  };
}

type Item = { title: string; body: string };

function features(lang: Lang): Item[] {
  return lang === "zh"
    ? [
        {
          title: "推荐，但由你决定",
          body: "先推荐框架（Lemonade 推荐，也有 llama.cpp、Ollama、LM Studio 等），再按本机配置推荐模型。推荐之外的框架和模型也可以直接说，助手会分析后给出结论。",
        },
        {
          title: "每条命令先给你看",
          body: "方案列出全部步骤和命令，确认后才在本机执行；需要你本人操作的步骤（如更新驱动）会停下来等你。",
        },
        {
          title: "出错时给修复办法",
          body: "某一步失败，报错自动交给 Radeon Arena 支持助手分析，给出修复命令；可以执行修复、重试或跳过。",
        },
        {
          title: "部署完直接能用",
          body: "最后给出本机 OpenAI 兼容地址、模型名和 API Key，并发一次测试请求确认能回复，填进常用的聊天客户端就能用。",
        },
        {
          title: "管理本地服务",
          body: "部署出来的服务登记在“本地服务”页，可以查看是否在运行、复制地址，或停止。",
        },
        {
          title: "中文和英文，可用自己的模型",
          body: "界面和助手回复可选中文或英文。驱动对话的模型默认用 Radeon Arena 在线模型，也可以填自己的 OpenAI 兼容地址和 Key。",
        },
      ]
    : [
        {
          title: "Recommendations, your choice",
          body: "It recommends a framework first (Lemonade, with llama.cpp, Ollama, LM Studio and others also offered), then models that fit your PC. You can name anything else; the agent looks into it and tells you what it found.",
        },
        {
          title: "You see every command first",
          body: "The plan lists every step and command, and nothing runs until you confirm. Steps only you can do, such as updating the driver, pause until you say they are done.",
        },
        {
          title: "Fixes when a step fails",
          body: "If a step fails, the error goes to the Radeon Arena support agent, which suggests a fix. Run the fix, retry, or skip.",
        },
        {
          title: "Ready to use at the end",
          body: "You get a local OpenAI-compatible URL, model name and API key, checked with a test request, ready to paste into your chat client.",
        },
        {
          title: "Manage local services",
          body: "Services it deploys are listed on the Local services page, where you can see whether they run, copy the URL, or stop them.",
        },
        {
          title: "English or Chinese, bring your own model",
          body: "The app and the agent's replies are in English or Chinese. The chat runs on a Radeon Arena online model by default; you can use your own OpenAI-compatible URL and key instead.",
        },
      ];
}

function steps(lang: Lang): Item[] {
  return lang === "zh"
    ? [
        { title: "下载并安装", body: "安装时只问安装位置，按当前用户安装，不需要管理员权限。" },
        { title: "用 GitHub 登录 Radeon Arena", body: "登录在程序弹出的窗口里完成，不用另开浏览器。" },
        { title: "在 Assistant 里说出需求", body: "比如“想在这台电脑上跑一个写代码的模型”，然后按推荐一步步选。" },
      ]
    : [
        { title: "Download and install", body: "The installer only asks where to install. It installs for the current user, without administrator rights." },
        { title: "Sign in to Radeon Arena with GitHub", body: "Sign-in happens in a window the app opens; no separate browser needed." },
        { title: "Tell the Assistant what you want", body: "For example, “I want to run a coding model on this PC”, then follow the recommendations." },
      ];
}

function notes(lang: Lang): Item[] {
  return lang === "zh"
    ? [
        { title: "系统", body: "Windows 10 或 11，64 位；界面用系统自带的 Microsoft Edge 打开。" },
        { title: "显卡", body: "AMD Radeon 独立显卡，或 Ryzen AI / Strix Halo 集成显卡。" },
        { title: "网络", body: "登录、对话和下载都走 Windows 系统代理；模型默认从 ModelScope 下载。" },
        { title: "安装包未签名", body: "Windows 可能提示“Windows 已保护你的电脑”，点“更多信息”，再点“仍要运行”。下载后可以用下面的 SHA-256 核对。" },
        { title: "卸载", body: "卸载时会停止它启动的服务；下载的模型和数据默认保留。" },
        { title: "数据", body: "你的需求、本机硬件配置和执行结果会发给 Radeon Arena 支持助手，用来给出方案和修复办法。详见隐私政策。" },
      ]
    : [
        { title: "System", body: "Windows 10 or 11, 64-bit. The app opens in Microsoft Edge, which comes with Windows." },
        { title: "GPU", body: "An AMD Radeon discrete GPU, or Ryzen AI / Strix Halo integrated graphics." },
        { title: "Network", body: "Sign-in, chat and downloads go through the Windows system proxy. Models download from ModelScope by default." },
        { title: "The installer is not signed yet", body: "Windows may say “Windows protected your PC”. Click “More info”, then “Run anyway”. You can check the download against the SHA-256 below." },
        { title: "Uninstalling", body: "Uninstalling stops the services it started. Downloaded models and data are kept by default." },
        { title: "Data", body: "Your request, your PC's hardware configuration and step results are sent to the Radeon Arena support agent to produce plans and fixes. See the privacy policy." },
      ];
}

// Illustrative start of a chat on a Strix Halo PC (hardware values from our test machine).
function Transcript({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  return (
    <figure className="rounded-xl border border-ink-700 bg-ink-900 p-5 shadow-sm">
      <figcaption className="text-xs text-zinc-500">{t(lang, "Example", "示例")}</figcaption>
      <div className="mt-4 space-y-4 text-sm leading-6">
        <p className="ml-auto max-w-[85%] rounded-lg bg-ink-800 px-3 py-2 text-zinc-100">
          {zh ? "想在这台电脑上跑一个写代码的模型" : "I want to run a coding model on this PC"}
        </p>
        <div className="max-w-[92%] text-zinc-300">
          <p>
            {zh
              ? "检测到 Radeon 8060S（Strix Halo），可用于模型的内存约 127 GB。先选部署框架："
              : "Found a Radeon 8060S (Strix Halo) with about 127 GB of memory for models. Pick a framework first:"}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            <li className="rounded-md border border-radeon-500 px-2.5 py-1 text-zinc-50">
              Lemonade <span className="text-radeon-600">{t(lang, "recommended", "推荐")}</span>
            </li>
            <li className="rounded-md border border-ink-700 px-2.5 py-1">llama.cpp</li>
            <li className="rounded-md border border-ink-700 px-2.5 py-1">LM Studio</li>
            <li className="rounded-md border border-ink-700 px-2.5 py-1">Ollama</li>
          </ul>
          <p className="mt-3 text-zinc-500">
            {zh ? "也可以直接输入别的框架或问题。" : "Or type another framework or a question."}
          </p>
        </div>
      </div>
    </figure>
  );
}

export function LocalHelperView({ lang }: { lang: Lang }) {
  const href = `/downloads/${HELPER_INSTALLER.file}`;
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6">
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            {t(lang, "Radeon Local Helper", "Radeon 本地助手")}
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">
            {t(
              lang,
              "Deploy a local LLM on your AMD GPU by talking to it. Say what you want to run; it recommends a framework and a model, runs each step on your PC once you confirm, and gives you a local OpenAI-compatible endpoint.",
              "在 AMD 显卡上部署本地大模型，用对话就行。说出想跑什么，它推荐框架和模型，经你确认后在本机一步步装好，最后给你一个本机 OpenAI 兼容地址。",
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={href} download className="btn-primary inline-flex min-h-[44px] items-center px-5 text-base">
              {t(lang, "Download for Windows", "下载 Windows 安装包")}
            </a>
            <span className="text-sm text-zinc-500">
              {t(
                lang,
                `Version ${HELPER_INSTALLER.version} preview, ${HELPER_INSTALLER.sizeMB} MB, Windows 10/11 64-bit`,
                `${HELPER_INSTALLER.version} 预览版，${HELPER_INSTALLER.sizeMB} MB，Windows 10/11 64 位`,
              )}
            </span>
          </div>
        </div>
        <Transcript lang={lang} />
      </section>

      <section aria-labelledby="lh-start" className="mt-20 border-t border-ink-700 pt-10">
        <h2 id="lh-start" className="text-xl font-semibold tracking-tight text-zinc-50">
          {t(lang, "Get started", "开始使用")}
        </h2>
        <ol className="mt-6 grid gap-8 md:grid-cols-3">
          {steps(lang).map((s, i) => (
            <li key={s.title}>
              <span className="text-sm font-semibold text-radeon-600">{i + 1}</span>
              <h3 className="mt-1 font-semibold text-zinc-50">{s.title}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="lh-what" className="mt-16 border-t border-ink-700 pt-10">
        <h2 id="lh-what" className="text-xl font-semibold tracking-tight text-zinc-50">
          {t(lang, "What it does", "它能做什么")}
        </h2>
        <dl className="mt-6 grid gap-x-12 md:grid-cols-2">
          {features(lang).map((f) => (
            <div key={f.title} className="border-b border-ink-700 py-5">
              <dt className="font-semibold text-zinc-50">{f.title}</dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-400">{f.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="lh-notes" className="mt-16 border-t border-ink-700 pt-10">
        <h2 id="lh-notes" className="text-xl font-semibold tracking-tight text-zinc-50">
          {t(lang, "Requirements and notes", "运行要求与说明")}
        </h2>
        <dl className="mt-6 max-w-3xl">
          {notes(lang).map((n) => (
            <div key={n.title} className="grid gap-x-8 gap-y-1 border-b border-ink-700 py-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="text-sm font-semibold text-zinc-50">{n.title}</dt>
              <dd className="text-sm leading-6 text-zinc-400">{n.body}</dd>
            </div>
          ))}
          <div className="grid gap-x-8 gap-y-1 border-b border-ink-700 py-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <dt className="text-sm font-semibold text-zinc-50">SHA-256</dt>
            <dd className="break-all font-mono text-xs leading-6 text-zinc-400">{HELPER_INSTALLER.sha256}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-zinc-500">
          <Link href={lp(lang, "/privacy")} className="text-radeon-600 hover:underline">
            {t(lang, "Privacy policy", "隐私政策")}
          </Link>
          {t(lang, ". Calling the support agent from your own code? See the ", "。想在自己的程序里直接调用支持助手？看 ")}
          <Link href={lp(lang, "/docs")} className="text-radeon-600 hover:underline">
            {t(lang, "API docs", "API 文档")}
          </Link>
          {t(lang, ".", "。")}
        </p>
      </section>
    </div>
  );
}
