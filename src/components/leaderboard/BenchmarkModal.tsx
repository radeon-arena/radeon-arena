"use client";

import { useEffect, useMemo, useState } from "react";
import yaml from "js-yaml";
import type { Benchmark } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { PROJECTS } from "@/lib/site";
import { VerificationBadge } from "./VerificationBadge";
import { getGithubBenchmark } from "@/lib/githubData";
import { useLang } from "@/components/LangProvider";

const HALO = PROJECTS.benchy; // radeonrun

function clusterLabel(n: number, zh: boolean): string {
  if (zh) return `${Math.max(1, n)} 卡`;
  return n <= 1 ? "1 GPU" : `${n} GPUs`;
}

export function BenchmarkModal({ id, onClose }: { id: string; onClose: () => void }) {
  const lang = useLang();
  const zh = lang === "zh";
  const [data, setData] = useState<Benchmark | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(false);
    getGithubBenchmark(id)
      .then((d) => {
        if (alive && d) setData(d);
        else if (alive) setError(true);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const recipeYaml = useMemo(() => {
    if (!data?.recipe) return "";
    try {
      return yaml.dump(data.recipe.fullRecipe ?? data.recipe, { indent: 2, lineWidth: -1, noRefs: true });
    } catch {
      return data.recipe.command ?? "";
    }
  }, [data]);

  const permalinkId = data?.recipePermalinkId ?? data?.benchmarkId ?? id;
  const rawUrl = "#recipe";
  const resolvedConfig = (data?.recipe?.fullRecipe?.config ?? {}) as Record<string, unknown>;
  const matrixId = pickStr(resolvedConfig.matrix_id) ?? "<matrix-id>";

  async function copyRecipe() {
    try {
      await navigator.clipboard.writeText(recipeYaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="card thin-scroll my-auto w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-ink-800 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-100 break-all">
            {data?.modelFullPath || data?.modelName || "Benchmark"}
          </h2>
          <button
            onClick={onClose}
            aria-label={zh ? "关闭" : "Close"}
            className="shrink-0 rounded-lg border border-ink-700 px-2.5 py-1 text-sm text-zinc-400 hover:bg-ink-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {error && <p className="px-6 py-10 text-center text-zinc-500">{zh ? "这条跑分加载失败。" : "Failed to load this benchmark."}</p>}
        {!error && !data && <p className="px-6 py-10 text-center text-zinc-500">{zh ? "加载中…" : "Loading…"}</p>}

        {data && (
          <div className="space-y-6 px-6 py-5">
            {/* Measured by — automated source, not a person */}
            <section className="rounded-xl border border-ink-800 bg-ink-950/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{zh ? "测试来源" : "Measured by"}</p>
                <VerificationBadge status={data.verificationStatus} />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 text-zinc-300">
                  {/* automated/benchmark glyph, not an avatar */}
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="12" rx="1.5" />
                    <path d="M8 20h8M12 16v4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-200">{data.dataSource || "RadeonArena"}</p>
                  <p className="text-xs text-zinc-500">
                    {zh ? "自动化测试工具" : "Automated benchmark harness"} · {data.creator?.name || data.gpu}
                  </p>
                </div>
              </div>
              {data.verification && (
                <div className="mt-3 rounded-lg border border-ink-700 bg-ink-950 p-3 text-xs text-zinc-400">
                  <p>
                    {zh ? "复核：提交值 " : "Verification: reported "}
                    <span className="font-mono text-zinc-200">{data.verification.reportedTps ?? "—"}</span>{zh ? "，复测值 " : " vs measured "}
                    <span className="font-mono text-zinc-200">{data.verification.measuredTps ?? "—"}</span> tok/s
                    {typeof data.verification.deviationPct === "number" ? <> · Δ {data.verification.deviationPct}%</> : null}
                  </p>
                  {data.verification.runner && (
                    <p className="mt-0.5 text-zinc-600">
                      {zh ? "复测：" : "reran by "}{data.verification.runner}
                      {data.verification.verifiedAt ? ` · ${fmtDate(data.verification.verifiedAt, lang)}` : ""}
                    </p>
                  )}
                  {data.verification.note && <p className="mt-0.5 text-zinc-500">{data.verification.note}</p>}
                </div>
              )}
            </section>

            {/* Model Information */}
            <section>
              <h3 className="text-sm font-semibold text-radeon-300">{zh ? "模型信息" : "Model Information"}</h3>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-ink-800 bg-ink-950/50 p-4 text-sm">
                <Info label={zh ? "引擎" : "Runtime"} value={data.runtime} sub={data.backend} />
                <Info label={zh ? "卡数" : "GPU Count"} value={clusterLabel(data.clusterSize, zh)} />
                <Info label="GPU" value={data.gpu} />
                <Info label={zh ? "量化" : "Quantization"} value={data.quantization} />
                <Info label={zh ? "测试项" : "Tests"} value={zh ? `${data.tests_count ?? data.tests?.length ?? 0} 项` : `${data.tests_count ?? data.tests?.length ?? 0} tests`} />
                <Info label={zh ? "测试时间" : "Measured"} value={fmtDate(data.submittedAt, lang)} />
              </dl>
            </section>

            {/* Reproducibility — the exact build that produced this number */}
            <ReproducibilitySection benchmark={data} zh={zh} />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {data.modelHuggingFaceUrl && (
                <a href={data.modelHuggingFaceUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  {zh ? "在 Hugging Face 查看 ↗" : "View on Hugging Face ↗"}
                </a>
              )}
              <button onClick={copyRecipe} className="btn-ghost">{zh ? "复制完整配置" : "Copy resolved configuration"}</button>
            </div>

            {/* Recipe */}
            {recipeYaml && (
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-radeon-300">{zh ? "配方" : "Recipe"}</h3>
                  <button onClick={copyRecipe} className="chip hover:border-radeon-600 hover:text-radeon-300">
                    {copied ? (zh ? "已复制 ✓" : "Copied ✓") : zh ? "复制" : "Copy"}
                  </button>
                </div>
                {data.recipe?.description && (
                  <p className="mt-2 text-sm text-zinc-400">{data.recipe.description}</p>
                )}
                <pre className="thin-scroll mt-2 max-h-72 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs leading-relaxed text-zinc-300">
                  {recipeYaml}
                </pre>
              </section>
            )}

            {/* How to Use */}
            <section className="border-t border-ink-800 pt-5">
              <h3 className="text-sm font-semibold text-radeon-300">{zh ? "如何复现" : "How to Use"}</h3>
              <p className="mt-2 text-sm text-zinc-400">
                {zh ? "用 " : "Reproduce this run with "}
                <a href={HALO.url} target="_blank" rel="noreferrer" className="text-radeon-400 hover:text-radeon-300">
                  {HALO.name}
                </a>
                {zh ? " 复现这次测试。radeonrun 提供面向 Radeon 的 AMD ROCm 容器和配方。" : " — AMD ROCm containers & recipes for Radeon."}
              </p>
              <pre className="thin-scroll mt-2 overflow-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs leading-relaxed text-zinc-300">
{zh
  ? `# 1. 克隆工具仓库
git clone ${HALO.url}.git
cd radeonrun

# 2. 运行上面这份测试矩阵
python3 run-recipe.py ${matrixId}

# 可选：换成任意 OCI 镜像
#   --image docker.io/vendor/runtime:tag`
  : `# 1. Clone the toolkit
git clone ${HALO.url}.git
cd radeonrun

# 2. Run the matrix shown above
python3 run-recipe.py ${matrixId}

# Optional: override with any OCI image
#   --image docker.io/vendor/runtime:tag`}
              </pre>
            </section>

            <section className="border-t border-ink-800 pt-5">
              <h3 className="text-sm font-semibold text-radeon-300">{zh ? "讨论" : "Discussion"}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                {zh
                  ? "本站的榜单数据只读。对结果有疑问，请到新增或更新这条数据的 GitHub PR 里讨论。"
                  : "Leaderboard data is read-only on this site. Discuss result changes in the GitHub pull request that adds or updates the benchmark data."}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, sub }: { label: string; value?: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-200">
        {value || "—"}
        {sub ? <span className="block text-xs font-normal text-zinc-500">{sub}</span> : null}
      </dd>
    </div>
  );
}

function pickStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function imageHref(image: string): string | undefined {
  if (/^https?:\/\//i.test(image)) return image;
  const withoutDigest = image.split("@", 1)[0];
  const withoutTag = withoutDigest.replace(/:[^/]+$/, "");
  if (withoutTag.startsWith("ghcr.io/")) {
    const name = withoutTag.slice("ghcr.io/".length);
    const [owner, ...rest] = name.split("/");
    if (!owner || !rest.length) return undefined;
    return `https://github.com/${owner}/pkgs/container/${encodeURIComponent(rest.join("/"))}`;
  }
  if (withoutTag.startsWith("quay.io/")) return `https://quay.io/repository/${withoutTag.slice("quay.io/".length)}`;
  const dockerName = withoutTag.replace(/^docker\.io\//, "");
  if (!dockerName.includes(".") && dockerName.includes("/")) return `https://hub.docker.com/r/${dockerName}`;
  return undefined;
}

/**
 * Reproducibility provenance — surfaces the exact requested/resolved image,
 * engine build commit, image digest, build flags) that produced this number.
 * Renders only the fields present in the result, so older records degrade
 * gracefully.
 */
function ReproducibilitySection({ benchmark, zh }: { benchmark: Benchmark; zh: boolean }) {
  const fr = (benchmark.recipe?.fullRecipe ?? {}) as Record<string, unknown>;
  const launch = (fr.launch ?? {}) as Record<string, unknown>;
  const image = pickStr(launch.image) || pickStr(fr.image) || pickStr(benchmark.recipe?.container);
  const imageRequested = pickStr(launch.image_requested);
  const imageResolved = pickStr(launch.image_resolved);
  const imageDigest = pickStr(launch.image_digest);
  const imageTag = pickStr(launch.image_tag) || pickStr(fr.imageTag);
  const imageCommit = pickStr(launch.image_commit) || pickStr(fr.imageCommit);
  const imageId = pickStr(launch.image_id) || pickStr(fr.imageId);
  const engineCommit = pickStr(launch.engine_commit) || pickStr(fr.engineCommit);
  const engineVersion = pickStr(launch.engine_version) || pickStr(fr.engineVersion);
  const buildFlags = pickStr(launch.build_flags) || pickStr(fr.buildFlags);

  const engineLine = [benchmark.runtime, engineVersion, engineCommit ? `@ ${engineCommit.slice(0, 12)}` : undefined]
    .filter(Boolean)
    .join(" ");

  const rows: { label: string; value: string; href?: string }[] = [];
  if (image) {
    const value = imageTag && !image.includes(":") ? `${image}:${imageTag}` : image;
    rows.push({ label: zh ? "容器镜像" : "Container image", value, href: imageHref(value) });
  }
  if (imageRequested && imageRequested !== image) rows.push({ label: zh ? "请求的镜像" : "Requested image", value: imageRequested, href: imageHref(imageRequested) });
  if (imageResolved) rows.push({ label: zh ? "解析后的镜像" : "Resolved image", value: imageResolved, href: imageHref(imageResolved) });
  if (imageDigest) rows.push({ label: zh ? "仓库 digest" : "Registry digest", value: imageDigest });
  if (imageCommit) rows.push({ label: zh ? "镜像构建 commit" : "Image build commit", value: imageCommit });
  if (imageId) rows.push({ label: zh ? "本地镜像 ID" : "Local image ID", value: imageId });
  if (engineLine.trim()) rows.push({ label: zh ? "引擎" : "Engine", value: engineLine });
  if (buildFlags) rows.push({ label: zh ? "编译参数" : "Build flags", value: buildFlags });

  if (rows.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold text-radeon-300">{zh ? "可复现信息" : "Reproducibility"}</h3>
      <p className="mt-1 text-xs text-zinc-500">
        {zh
          ? "以下镜像来源由测试工具记录。请求的镜像引用可以来自任意 OCI 仓库；有 digest 和本地镜像 ID 时，可据此确认实际测试的构建。"
          : "Image provenance captured by the runner. The requested reference may come from any OCI registry; resolved digest and local image ID identify the measured build when available."}
      </p>
      <dl className="mt-2 space-y-2 rounded-xl border border-ink-800 bg-ink-950/50 p-4">
        {rows.map((r) => (
          <Provenance key={r.label} label={r.label} value={r.value} href={r.href} zh={zh} />
        ))}
      </dl>
    </section>
  );
}

function Provenance({ label, value, href, zh }: { label: string; value: string; href?: string; zh: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="shrink-0 text-xs text-zinc-500 sm:w-32">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-baseline gap-2">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-radeon-400 hover:text-radeon-300 hover:underline">
            {value}
          </a>
        ) : (
          <span className="break-all font-mono text-xs text-zinc-300">{value}</span>
        )}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {
              /* clipboard unavailable */
            }
          }}
          className="shrink-0 text-[11px] text-zinc-600 hover:text-radeon-300"
          aria-label={zh ? `复制${label}` : `Copy ${label}`}
        >
          {copied ? "✓" : zh ? "复制" : "copy"}
        </button>
      </dd>
    </div>
  );
}

