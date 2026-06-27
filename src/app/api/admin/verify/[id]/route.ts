import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { pgEnabled } from "@/lib/db";
import { getBenchmarkPg, updateVerificationPg } from "@/lib/pgSource";
import type { Benchmark, VerificationRecord, VerificationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_TOLERANCE = Number(process.env.VERIFY_TOLERANCE_PCT ?? "5");

/** Single-stream decode tok/s, the anchor metric used for verification. */
function decodeTps(b: Benchmark): number {
  const t =
    b.tests.find((x) => x.testName === "tg128 (c1)") ??
    b.tests.find((x) => x.testName.startsWith("tg")) ??
    b.tests[0];
  return t?.tokensPerSec ?? 0;
}

interface VerifyBody {
  measuredTps?: number; // manual: result of an out-of-band rerun
  status?: VerificationStatus; // manual override ("verified" | "failed")
  note?: string;
  runner?: string;
}

/**
 * POST /api/admin/verify/[id] — admin triggers verification of a submission (DESIGN.md §4).
 *
 * Auto mode: if RUNNER_VERIFY_URL is set, the recipe is POSTed to the runner,
 * which reruns it on a trusted card and returns { measuredTps }. The reported vs
 * measured decode tok/s are compared against VERIFY_TOLERANCE_PCT (default 5%):
 *   within tolerance → 'verified' (✅)
 *   outside          → 'failed'   (⚠️ — KEPT on the board, opened for discussion)
 *
 * Fallback (no runner): admin passes `measuredTps`, or an explicit `status`.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!pgEnabled())
    return NextResponse.json({ error: "Verification requires a configured database" }, { status: 503 });

  const bm = await getBenchmarkPg(params.id);
  if (!bm) return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });

  let body: VerifyBody = {};
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    /* empty body is allowed (auto mode) */
  }

  const reportedTps = decodeTps(bm);
  const tolerance = DEFAULT_TOLERANCE;
  let measuredTps = body.measuredTps;
  let runner = body.runner ?? "manual";

  // Auto rerun via a configured runner service (radeonrun runner endpoint).
  const runnerUrl = process.env.RUNNER_VERIFY_URL;
  if (measuredTps === undefined && !body.status && runnerUrl) {
    try {
      const r = await fetch(runnerUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.RUNNER_TOKEN ? { authorization: `Bearer ${process.env.RUNNER_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          id: bm.id,
          recipe: bm.recipe,
          gpu: bm.gpu,
          modelFullPath: bm.modelFullPath,
        }),
      });
      if (r.ok) {
        const out = (await r.json()) as { measuredTps?: number; runner?: string };
        measuredTps = out.measuredTps;
        runner = out.runner ?? "radeonrun";
      }
    } catch {
      /* runner unreachable → fall through to manual/pending */
    }
  }

  let rec: VerificationRecord;
  if (body.status === "verified" || body.status === "failed") {
    // Explicit admin override.
    rec = {
      status: body.status,
      verifiedAt: new Date().toISOString(),
      runner,
      reportedTps,
      measuredTps,
      tolerancePct: tolerance,
      note: body.note,
    };
  } else if (typeof measuredTps === "number" && reportedTps > 0) {
    const deviationPct = (Math.abs(measuredTps - reportedTps) / reportedTps) * 100;
    const status: VerificationStatus = deviationPct <= tolerance ? "verified" : "failed";
    rec = {
      status,
      verifiedAt: new Date().toISOString(),
      runner,
      reportedTps,
      measuredTps,
      deviationPct: Math.round(deviationPct * 100) / 100,
      tolerancePct: tolerance,
      note: body.note,
    };
  } else {
    return NextResponse.json(
      {
        error:
          "No measuredTps available — set RUNNER_VERIFY_URL for auto rerun, or pass measuredTps/status in the body.",
      },
      { status: 400 },
    );
  }

  const updated = await updateVerificationPg(params.id, rec);
  return NextResponse.json({ id: bm.id, verification: rec, benchmark: updated });
}
