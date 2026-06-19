import { NextResponse } from "next/server";
import { getAllBenchmarks } from "@/lib/dataSource";
import { computeOrgLeaderboard } from "@/lib/scoring";
import { hwMatches } from "@/lib/hardware";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/organizations?hw=strix — model-publisher ranking, scoped to a GPU.
export async function GET(req: Request) {
  const hw = new URL(req.url).searchParams.get("hw");
  let benchmarks = await getAllBenchmarks();
  if (hw) benchmarks = benchmarks.filter((b) => hwMatches(hw, b.gpu));
  const entries = computeOrgLeaderboard(benchmarks);
  return NextResponse.json({
    version: 1,
    generatedAt: new Date().toISOString(),
    totalOrganizations: entries.length,
    entries,
  });
}
