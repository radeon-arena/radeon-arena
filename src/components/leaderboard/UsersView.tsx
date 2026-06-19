"use client";

import { useEffect, useState } from "react";
import type { UserLeaderboardEntry } from "@/lib/types";
import { rankBadge } from "@/lib/format";

export function UsersView({ hw }: { hw: string }) {
  const [entries, setEntries] = useState<UserLeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setEntries(null);
    setError(false);
    fetch(`/api/leaderboard/users?hw=${encodeURIComponent(hw)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setError(true));
  }, [hw]);

  if (error) return <p className="py-12 text-center text-zinc-500">Failed to load contributors.</p>;
  if (!entries) return <p className="py-12 text-center text-zinc-500">Loading contributors…</p>;

  return (
    <div className="card thin-scroll overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Contributor</th>
            <th className="px-4 py-3 text-right">Runs</th>
            <th className="px-4 py-3 text-right">Models</th>
            <th className="px-4 py-3 text-right">Params (B)</th>
            <th className="px-4 py-3 text-right">Est. VRAM (GB)</th>
            <th className="px-4 py-3 text-right">Avg tok/s</th>
            <th className="px-4 py-3 text-right">Score</th>
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
                    {e.githubProfile && <a href={e.githubProfile} className="hover:text-radeon-400">gh</a>}
                    {e.forumProfile && <a href={e.forumProfile} className="hover:text-radeon-400">fo</a>}
                    {e.linkedinProfile && <a href={e.linkedinProfile} className="hover:text-radeon-400">in</a>}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{e.runs}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{e.uniqueModels}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{e.totalModelParamsB.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{e.totalEstimatedVramGb.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-mono text-zinc-400">{e.avgTokensPerSec.toFixed(1)}</td>
              <td className="px-4 py-2.5 text-right font-mono font-semibold text-radeon-300" title={`vram ${e.contributions.vram} · size ${e.contributions.modelSize} · runs ${e.contributions.runs} · models ${e.contributions.uniqueModels} · tps ${e.contributions.tps}`}>
                {e.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
