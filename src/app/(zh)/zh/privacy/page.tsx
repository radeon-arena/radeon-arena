import type { Metadata } from "next";
import Link from "next/link";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "隐私政策 - Radeon Arena",
  description: "Radeon Arena 如何处理账户、会话、支持助手任务和站点数据。",
  alternates: alternates("zh", "/privacy"),
};

export default function PrivacyPageZh() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/zh/" className="text-sm text-radeon-400 hover:text-radeon-300">← 返回首页</Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">隐私政策</h1>
      <p className="mt-3 text-sm text-zinc-500">最后更新：2026-11-26。</p>

      <div className="card mt-8 space-y-6 p-7 text-sm leading-7 text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">账户与登录</h2>
          <p className="mt-2 text-zinc-400">
            登录不是必须的。启用 GitHub 登录时，使用 Radeon Arena 自己的 OAuth 应用，带 state 和 PKCE。GitHub
            访问令牌只用来读取你的身份以及公开邮箱或已验证的主邮箱，读取后即丢弃。每个账户都必须有已验证的邮箱；GitHub
            没有提供时，我们会请你填写邮箱并用验证码确认。我们不收集手机号。邮箱验证码只能用一次，10
            分钟后失效。我们保存显示名、登录方的稳定标识、已验证邮箱、头像地址、角色、账户状态和登录时间。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">会话、设备与部署记录</h2>
          <p className="mt-2 text-zinc-400">
            网页会话令牌和设备令牌都是随机值，只保存其哈希。网页会话使用 Secure、HttpOnly、SameSite=Lax 的
            Cookie。设备记录包括安装标识、名称、创建和最近使用时间以及吊销状态。授权设备时，你可以把该安装实例在 Radeon
            Arena 上的部署会话、机器配置、请求的任务、生成的方案、结果状态和排障记录关联到你的账户。为防止滥用，IP 地址只保留
            IPv4 /24 或 IPv6 /48 前缀。
          </p>
          <p className="mt-2 text-zinc-400">
            在账户页可以导出账户数据、吊销设备和删除账户。删除账户会同时删除关联的部署会话和设备凭据，本地安装实例回到匿名状态。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">支持助手与模型处理</h2>
          <p className="mt-2 text-zinc-400">
            支持助手的任务（部署方案、问答或排障）会保存以下内容：结构化的机器配置、问题或请求的任务、追问、回复、生成的方案、打码后的排障记录、回复语言，以及你明确上报的结果。这些数据用于多轮任务、你的历史记录和排障。问题、方案和诊断会发送给AMD RadeonCloud 提供的大模型服务。为了作答，助手可能向
            DuckDuckGo 和 GitHub 发送搜索词，并抓取公开网页。知识库检索在 Radeon Arena 服务器上完成，不经过大模型。请不要附带凭据或无关的个人信息。
          </p>
          <p className="mt-2 text-zinc-400">
            保存问题、报错和追问之前，服务会把常见的 API 令牌、Authorization 头、key 和 password 赋值、IPv4
            地址以及用户目录中的用户名打码。MCP 客户端也会对上报的报错打码。GitHub 访问令牌、OAuth
            授权码、网页会话令牌、设备令牌、Cookie 和 API Key 都不会存入会话记录。登录用户可以导出或删除自己的账户和关联会话。匿名会话目前还没有自动删除期限。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">静态托管与第三方请求</h2>
          <p className="mt-2 text-zinc-400">
            本站是静态网站，经 Cloudflare 和 nginx 源站提供。浏览器从本站的 <code>/data/bundle.json</code>
            读取跑分数据，该文件由公开的 radeonrun 仓库生成。GitHub、Hugging Face、ROCm 等外部链接和社区资源适用其各自的政策。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">GitHub 贡献</h2>
          <p className="mt-2 text-zinc-400">
            提交配方或跑分结果通过 GitHub 的 Pull Request 和 Issue 进行。GitHub 账户信息、提交元数据、评论和评审记录由 GitHub
            处理，并按 GitHub 的平台规则和政策公开。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">统计</h2>
          <p className="mt-2 text-zinc-400">
            本站使用自有的统计脚本，不使用第三方统计服务。脚本会把页面浏览、点击（链接文字和地址）、来源页、时区、浏览器语言、窗口尺寸、浏览器是否报告为自动化程序、停留时长和滚动深度发送到本站的
            <code>/event</code> 接口，并用保存在浏览器本地存储里的随机访客 ID 和会话 ID 关联。托管和 DNS 服务商可能保留常规运行日志，例如安全、稳定性和防滥用所需的请求元数据。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">保留期限与变更</h2>
          <p className="mt-2 text-zinc-400">
            网页会话 30 天无活动即过期，设备凭据 90 天未使用即失效。运行和审计记录只在安全与支持需要的范围内保留。账户数据的收集方式发生重大变化时，我们会提前或同时更新本说明。
          </p>
        </section>
      </div>
    </section>
  );
}
