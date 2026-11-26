import type { Metadata } from "next";
import Link from "next/link";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "服务条款 - Radeon Arena",
  description: "Radeon Arena 使用条款。",
  alternates: alternates("zh", "/terms"),
};

export default function TermsPageZh() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/zh/" className="text-sm text-radeon-400 hover:text-radeon-300">← 返回首页</Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">服务条款</h1>
      <p className="mt-3 text-sm text-zinc-500">最后更新：2026-11-16。如中英文版本不一致，以英文版为准。</p>

      <div className="card mt-8 space-y-6 p-7 text-sm leading-7 text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">关于 Radeon Arena</h2>
          <p className="mt-2 text-zinc-400">
            Radeon Arena 发布 AMD Radeon 硬件上的大模型推理跑分，并提供开发者支持服务。跑分结果来自 radeonrun
            仓库中公开的配方和结果文件。本站用于技术对比和复现，不对任何产品、负载、驱动、模型或服务作担保或认证。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">贡献</h2>
          <p className="mt-2 text-zinc-400">
            贡献通过 GitHub Pull Request 提交。提交配方、结果文件、文档或元数据，即表示你有权贡献这些内容，并同意本项目将其作为公开跑分数据集和网站的一部分展示、复制、转换和再分发。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">数据质量</h2>
          <p className="mt-2 text-zinc-400">
            我们力求展示真实、可复现的结果。但跑分数字仍会随硬件、固件、驱动、模型版本、容器镜像、引擎提交和运行条件而变化，请勿把任何结果当作你环境中的性能保证。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">使用规范</h2>
          <p className="mt-2 text-zinc-400">
            请勿提交恶意内容、编造的数据、私人凭据、违法材料或侵犯第三方权利的内容。对不符合本项目可复现与透明要求的内容，维护者可以拒绝、删除或加注说明。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">免责声明</h2>
          <p className="mt-2 text-zinc-400">
            本站和数据集按现状提供，不对准确性、可用性、适销性、特定用途适用性或不侵权作任何保证。本项目可随时修改或删除页面、数据集、链接或功能。
          </p>
        </section>
      </div>
    </section>
  );
}
