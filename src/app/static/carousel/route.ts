import { NextResponse } from "next/server";
import { buildCarousel, getAllBenchmarks } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

// GET /static/carousel — highlight reel of top decode results for the homepage.
export async function GET() {
  const carousel = buildCarousel(await getAllBenchmarks());
  return NextResponse.json(carousel, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300" },
  });
}
