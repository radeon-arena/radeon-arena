import type { Metadata } from "next";
import Link from "next/link";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "数据政策 - Radeon Arena",
  description: "Radeon Arena 跑分数据的来源、复现要求和收录范围。",
  alternates: alternates("zh", "/data-policy"),
};

export default function DataPolicyPageZh() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/zh/" className="text-sm text-radeon-400 hover:text-radeon-300">← 返回首页</Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-50">数据政策</h1>
      <p className="mt-3 text-sm text-zinc-500">最后更新：2026-06-30。</p>

      <div className="card mt-8 space-y-6 p-7 text-sm leading-7 text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">数据来源</h2>
          <p className="mt-2 text-zinc-400">
            跑分数据以公开的 radeonrun 仓库为准：配方在 <code>recipes/*.yaml</code>，实测结果在{" "}
            <code>results/&lt;device&gt;/*.json</code>，网站读取由此生成的 <code>results/bundle.json</code> 静态数据文件。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">复现要求</h2>
          <p className="mt-2 text-zinc-400">
            每条结果都应对应到配方、跑分配置、模型来源、引擎或容器镜像、镜像标签或摘要、硬件标识和实测输出。像{" "}
            <code>:latest</code> 这样会变的标签不能作为榜单结果的身份。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">收录范围</h2>
          <p className="mt-2 text-zinc-400">
            公开榜单只收 AMD Radeon / RDNA 硬件。CDNA/Instinct 和 NVIDIA 的结果不在 Radeon Arena 榜单之内，除非以后的政策明确另设视图。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">未完成或失败的测试</h2>
          <p className="mt-2 text-zinc-400">
            未完成、失败或没有覆盖规定跑分配置的结果，不应被当作完整的榜单条目。在补齐缺失的测点之前，这类结果可能被拒绝、重测或单独记录。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">不收编造的数据</h2>
          <p className="mt-2 text-zinc-400">
            请勿把占位数字、手写的估计值或从无关系统抄来的结果，当作按所列配方跑出的结果提交。结果来自不同环境的，必须如实说明，否则不能进入榜单。
          </p>
        </section>
      </div>
    </section>
  );
}
