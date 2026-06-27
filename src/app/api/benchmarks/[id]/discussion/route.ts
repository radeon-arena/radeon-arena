import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { pgEnabled } from "@/lib/db";
import { getDiscussions, addDiscussion } from "@/lib/discussions";

export const dynamic = "force-dynamic";

// GET /api/benchmarks/[id]/discussion — list discussion posts for a benchmark.
// Especially used by ⚠️ reproduction-failed entries, which stay on the board
// and are opened for debate (DESIGN.md §4).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const posts = await getDiscussions(params.id);
  return NextResponse.json({ posts });
}

// POST /api/benchmarks/[id]/discussion — add a post (signed-in users only).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  // 30 comments / 10 min / client.
  if (!rateLimit(`discussion:${clientIp(req)}`, 30, 10 * 60 * 1000))
    return NextResponse.json({ error: "Rate limit exceeded \u2014 try again later" }, { status: 429 });
  if (!pgEnabled())
    return NextResponse.json({ error: "Discussion requires a configured database" }, { status: 503 });

  let body: { body?: string };
  try {
    body = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = (body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  const post = await addDiscussion({
    benchmarkId: params.id,
    author: user.name ?? user.email ?? "User",
    body: text,
  });
  return NextResponse.json({ post }, { status: 201 });
}
