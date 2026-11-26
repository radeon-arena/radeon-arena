"use client";

import { RecipeGeneratorView } from "./RecipeGeneratorView";
import { useLang } from "@/components/LangProvider";

const RADEONRUN = "https://github.com/radeon-arena/radeonrun";

export function SubmitView({ hw }: { hw?: string }) {
  const zh = useLang() === "zh";
  return (
    <div className="space-y-4">
      <div className="card p-7 text-sm leading-relaxed text-zinc-300">
        <h2 className="text-xl font-semibold text-zinc-100">{zh ? "提交配方" : "Submit Recipe"}</h2>
        {zh ? (
          <>
            <p className="mt-3 text-zinc-400">
              Radeon Arena 只通过 GitHub Pull Request 接收跑分更新，不接受网页表单填写的数字。榜单上的每一行都要对应一个可复现的测试矩阵、一个有记录的镜像，以及一份能在 git 里审阅的实测结果文件。
            </p>
            <p className="mt-3 text-zinc-400">
              请向 <span className="font-medium text-zinc-200">radeon-arena/radeonrun</span> 提交 PR，包含模型、启动、矩阵三份配置和实测的{" "}
              <code>results/&lt;device&gt;/&lt;matrix&gt;.json</code>。写明模型、引擎、量化格式、GPU、跑分配置、请求的镜像与实际解析到的镜像，以及实测的吞吐和延迟。
            </p>
            <p className="mt-3 text-zinc-400">维护者审阅 PR、确认数字可以复现、测法与榜单一致后合并。</p>
          </>
        ) : (
          <>
            <p className="mt-3 text-zinc-400">
              Radeon Arena accepts benchmark updates through GitHub pull requests. The site does not accept
              numbers from a web form: every row should be tied to a reproducible matrix and recorded image identity, and
              a measured result file that can be reviewed in git.
            </p>
            <p className="mt-3 text-zinc-400">
              Open a PR against <span className="font-medium text-zinc-200">radeon-arena/radeonrun</span> with
              model/launch/matrix specs and the measured <code>results/&lt;device&gt;/&lt;matrix&gt;.json</code>. Include the model,
              runtime, quantization, GPU, benchmark profile, requested/resolved image identity, and the measured
              throughput/latency numbers.
            </p>
            <p className="mt-3 text-zinc-400">
              Maintainers review the PR, verify that the numbers are reproducible, and merge the update once
              the result matches the board&apos;s methodology.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`${RADEONRUN}/pulls`} className="btn-primary">{zh ? "提交 Pull Request" : "Open a pull request"}</a>
          <a href={RADEONRUN} className="btn-ghost">{zh ? "查看 radeonrun" : "View radeonrun"}</a>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        {zh
          ? "测试参数来自所选的跑分配置；提交的结果会记录每个输入输出长度、上下文深度、并发数和重复次数。"
          : "Measurement parameters come from the selected benchmark profile; the committed result records every input/output length, depth, concurrency, and repetition."}
      </p>

      <div className="card p-7">
        <h3 className="text-lg font-semibold text-zinc-100">{zh ? "矩阵草稿生成器" : "Matrix draft helper"}</h3>
        <p className="mt-2 text-sm text-zinc-400">
          {zh
            ? "粘贴一条启动命令，生成模型、启动、矩阵三份 YAML 初稿。这只是草稿：提交前请核对镜像、模型来源、占位符和实测结果 JSON。"
            : "Paste a serve command to generate starter Model, Launch, and Matrix YAML documents. Treat them as a draft: verify the OCI image, model source, placeholders, and measured result JSON before submitting."}
        </p>
        <div className="mt-5">
          <RecipeGeneratorView hw={hw} />
        </div>
      </div>
    </div>
  );
}
