import { NextResponse } from "next/server";
import { getBenchmark } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

// GET /api/benchmarks/[id] — full submission detail incl. recipe & all tests.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const benchmark = await getBenchmark(params.id);
  if (!benchmark) {
    return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
  }
  return NextResponse.json(benchmark);
}
