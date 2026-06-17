import { NextResponse } from "next/server";
import { getAllBenchmarks } from "@/lib/dataSource";
import { computeOrgLeaderboard } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/organizations — model-publisher ranking.
export async function GET() {
  const entries = computeOrgLeaderboard(await getAllBenchmarks());
  return NextResponse.json({
    version: 1,
    generatedAt: new Date().toISOString(),
    totalOrganizations: entries.length,
    entries,
  });
}
