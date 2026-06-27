import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { pgEnabled } from "@/lib/db";
import { getPendingPg } from "@/lib/pgSource";

export const dynamic = "force-dynamic";

// GET /api/admin/pending — the verification queue (user-submitted, pending). Admin only.
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!pgEnabled()) return NextResponse.json({ pending: [] });
  const pending = await getPendingPg();
  return NextResponse.json({ pending });
}
