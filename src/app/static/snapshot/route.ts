import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

// GET /static/snapshot — the full per-test leaderboard aggregate.
export async function GET() {
  const snapshot = await getSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": `public, s-maxage=${Math.round(snapshot.metadata.snapshotIntervalHours * 3600)}, stale-while-revalidate=300`,
    },
  });
}
