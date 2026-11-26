"use client";

import { useEffect, useState } from "react";
import type { UserLeaderboardEntry } from "@/lib/types";
import { rankBadge } from "@/lib/format";
import { getGithubUsers } from "@/lib/githubData";
import { useLang } from "@/components/LangProvider";

export function UsersView({ hw }: { hw: string }) {
  const zh = useLang() === "zh";
  const [entries, setEntries] = useState<UserLeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setEntries(null);
    setError(false);
    getGithubUsers(hw)
      .then((entries) => setEntries(entries))
      .catch(() => setError(true));
  }, [hw]);

  if (error) return <p className="py-12 text-center text-zinc-500">{zh ? "贡献者数据加载失败。" : "Failed to load contributors."}</p>;
  if (!entries) return <p className="py-12 text-center text-zinc-500">{zh ? "正在加载贡献者…" : "Loading contributors…"}</p>;

  if (entries.length === 0) {
    return <p className="py-12 text-center text-zinc-500">{zh ? "还没有贡献者。" : "No contributors yet."}</p>;
  }

  return (
    <div className="card thin-scroll overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">{zh ? "贡献者" : "Contributor"}</th>
            <th className="px-4 py-3 text-right">{zh ? "提交次数" : "Runs"}</th>
            <th className="px-4 py-3 text-right">{zh ? "模型数" : "Models"}</th>
            <th className="px-4 py-3 text-right">{zh ? "参数量 (B)" : "Params (B)"}</th>
            <th className="px-4 py-3 text-right">{zh ? "估算显存 (GB)" : "Est. VRAM (GB)"}</th>
            <th className="px-4 py-3 text-right">{zh ? "平均 tok/s" : "Avg tok/s"}</th>
            <th className="px-4 py-3 text-right">{zh ? "得分" : "Score"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {entries.map((e) => (
            <tr key={e.userId} className="hover:bg-ink-850/60">
              <td className={`px-4 py-2.5 font-mono ${rankBadge(e.rank)}`}>{e.rank}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {e.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.avatarUrl} alt="" width={24} height={24} className="rounded-full" />
                  )}
                  <span className="text-zinc-200">{e.displayName}</span>
                  <span className="flex gap-1 text-xs text-zinc-600">
                    {e.githubProfile && <a href={e.githubProfile} className="hover:text-radeon-400" title="GitHub">gh</a>}
                    {e.forumProfile && <a href={e.forumProfile} className="hover:text-radeon-400" title={zh ? "论坛" : "Forum"}>fo</a>}
                    {e.linkedinProfile && <a href={e.linkedinProfile} className="hover:text-radeon-400" title="LinkedIn">in</a>}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{e.runs}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{e.uniqueModels}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{e.totalModelParamsB.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{e.totalEstimatedVramGb.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{e.avgTokensPerSec.toFixed(1)}</td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-radeon-300" title={zh
                ? `显存 ${e.contributions.vram} · 参数量 ${e.contributions.modelSize} · 提交 ${e.contributions.runs} · 模型 ${e.contributions.uniqueModels} · 速度 ${e.contributions.tps}`
                : `vram ${e.contributions.vram} · size ${e.contributions.modelSize} · runs ${e.contributions.runs} · models ${e.contributions.uniqueModels} · tps ${e.contributions.tps}`}>
                {e.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
