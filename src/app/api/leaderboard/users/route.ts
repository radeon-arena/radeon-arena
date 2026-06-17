import { NextResponse } from "next/server";
import { getAllBenchmarks } from "@/lib/dataSource";
import { computeUserLeaderboard } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/users — contributor ranking.
// NOTE: unlike the original Spark Arena API, we deliberately do NOT expose
// contributor email addresses here (PII hygiene).
export async function GET() {
  const entries = computeUserLeaderboard(await getAllBenchmarks());
  return NextResponse.json({
    version: 1,
    generatedAt: new Date().toISOString(),
    totalContributors: entries.length,
    entries,
  });
}
