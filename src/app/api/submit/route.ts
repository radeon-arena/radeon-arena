import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { pgEnabled } from "@/lib/db";
import { insertBenchmarkPg } from "@/lib/pgSource";
import type { Benchmark, BenchTest, Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SubmitTest {
  testName: string;
  tokensPerSec: number;
  tpotMs?: number;
  e2eTtft?: number;
  ttfr?: number;
}

interface SubmitBody {
  modelName: string;
  modelFullPath: string;
  modelHuggingFaceUrl?: string;
  runtime: string;
  backend?: string;
  quantization: string;
  gpu: string;
  clusterSize?: number;
  // Reproduction provenance (DESIGN §7: every number must be reproducible).
  dockerImage?: string;
  frameworkVersion?: string;
  frameworkCommit?: string;
  buildFlags?: string;
  serveCommand?: string;
  benchCommand?: string;
  scenario?: string;
  tests: SubmitTest[];
}

/**
 * POST /api/submit — a signed-in user submits a recipe + self-reported result.
 *
 * Per DESIGN.md §4, the row is stored as verification_status='pending'
 * (self_reported=true): it joins the verification queue and shows as
 * "pending verification" until a runner reruns and confirms (✅) or fails (⚠️).
 * Self-reported numbers are never trusted onto the board un-verified.
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in to submit a benchmark" }, { status: 401 });
  // 20 submissions / hour / client — a token is shared, so throttle the flood.
  if (!rateLimit(`submit:${clientIp(req)}`, 20, 60 * 60 * 1000))
    return NextResponse.json({ error: "Rate limit exceeded \u2014 try again later" }, { status: 429 });
  if (!pgEnabled())
    return NextResponse.json({ error: "Submissions require a configured database" }, { status: 503 });

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate at the trust boundary.
  const required: Record<string, unknown> = {
    modelName: body.modelName,
    modelFullPath: body.modelFullPath,
    runtime: body.runtime,
    quantization: body.quantization,
    gpu: body.gpu,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length)
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });

  // Cap string fields at the trust boundary (avoid oversized payloads / DB bloat).
  const MAX_LEN: Record<string, number> = {
    modelName: 200, modelFullPath: 300, modelHuggingFaceUrl: 500, runtime: 100,
    backend: 100, quantization: 100, gpu: 200, dockerImage: 300,
    frameworkVersion: 100, frameworkCommit: 100, buildFlags: 1000,
    serveCommand: 8000, benchCommand: 8000, scenario: 200,
  };
  for (const [k, max] of Object.entries(MAX_LEN)) {
    const v = (body as unknown as Record<string, unknown>)[k];
    if (typeof v === "string" && v.length > max)
      return NextResponse.json({ error: `${k} exceeds ${max} characters` }, { status: 400 });
  }

  if (!Array.isArray(body.tests) || body.tests.length === 0)
    return NextResponse.json({ error: "At least one test result is required" }, { status: 400 });
  if (body.tests.length > 64)
    return NextResponse.json({ error: "Too many test results (max 64)" }, { status: 400 });

  const tests: BenchTest[] = body.tests
    .filter((t) => t && t.testName && Number.isFinite(t.tokensPerSec))
    .map((t) => ({
      testName: String(t.testName),
      tokensPerSec: Number(t.tokensPerSec),
      tpotMs: t.tpotMs,
      e2eTtft: t.e2eTtft,
      ttfr: t.ttfr,
    }));
  if (tests.length === 0)
    return NextResponse.json({ error: "No valid test results" }, { status: 400 });

  const id = randomUUID();
  const now = new Date().toISOString();
  const serveCommand = body.serveCommand?.trim() || "";
  const recipe: Recipe = {
    name: `${body.modelName} · ${body.runtime}`,
    version: 1,
    command: serveCommand,
    container: body.dockerImage,
    fullRecipe: {
      engine: body.runtime,
      engineVersion: body.frameworkVersion,
      engineCommit: body.frameworkCommit,
      backend: body.backend,
      buildFlags: body.buildFlags,
      gpu: body.gpu,
      quantization: body.quantization,
      scenario: body.scenario,
      image: body.dockerImage,
      serveCommand: serveCommand || undefined,
      benchCommand: body.benchCommand,
    },
  };

  const benchmark: Benchmark = {
    id,
    benchmarkId: id,
    submissionId: id,
    userId: user.uid,
    creator: { name: user.name ?? user.email ?? "Community contributor" },
    modelName: body.modelName,
    modelFullPath: body.modelFullPath,
    modelHuggingFaceUrl: body.modelHuggingFaceUrl,
    runtime: body.runtime,
    backend: body.backend,
    quantization: body.quantization,
    clusterSize: body.clusterSize ?? 1,
    gpu: body.gpu,
    recipeType: "manual",
    recipe,
    tests,
    tests_count: tests.length,
    dataSource: "Community",
    verificationStatus: "pending",
    selfReported: true,
    submittedAt: now,
  };

  await insertBenchmarkPg(benchmark);
  return NextResponse.json({ id, status: "pending" }, { status: 201 });
}
