import { NextResponse } from "next/server";
import { getAllBenchmarks } from "@/lib/dataSource";
import { computeUserLeaderboard } from "@/lib/scoring";
import { hwMatches } from "@/lib/hardware";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/users?hw=strix — contributor ranking, scoped to a GPU.
// NOTE: unlike the original Spark Arena API, we deliberately do NOT expose
// contributor email addresses here (PII hygiene).
export async function GET(req: Request) {
  const hw = new URL(req.url).searchParams.get("hw");
  let benchmarks = await getAllBenchmarks();
  if (hw) benchmarks = benchmarks.filter((b) => hwMatches(hw, b.gpu));
  const entries = computeUserLeaderboard(benchmarks);
  return NextResponse.json({
    version: 1,
    generatedAt: new Date().toISOString(),
    totalContributors: entries.length,
    entries,
  });
}
