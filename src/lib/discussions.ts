import "server-only";

import { randomUUID } from "crypto";
import type { DiscussionPost } from "./types";
import { query, pgEnabled } from "./db";

interface DRow {
  id: string;
  benchmark_id: string;
  author: string;
  author_avatar: string | null;
  body: string;
  created_at: string | Date;
}

function toPost(r: DRow): DiscussionPost {
  return {
    id: r.id,
    benchmarkId: r.benchmark_id,
    author: r.author,
    authorAvatar: r.author_avatar ?? undefined,
    body: r.body,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  };
}

/** All discussion posts for a benchmark, oldest first. Empty when PG is off. */
export async function getDiscussions(benchmarkId: string): Promise<DiscussionPost[]> {
  if (!pgEnabled()) return [];
  const rows = await query<DRow>(
    `SELECT id, benchmark_id, author, author_avatar, body, created_at
       FROM discussions WHERE benchmark_id = $1 ORDER BY created_at ASC`,
    [benchmarkId],
  );
  return rows.map(toPost);
}

/** Append a discussion post. */
export async function addDiscussion(input: {
  benchmarkId: string;
  author: string;
  authorAvatar?: string;
  body: string;
}): Promise<DiscussionPost> {
  const post: DiscussionPost = {
    id: randomUUID(),
    benchmarkId: input.benchmarkId,
    author: input.author,
    authorAvatar: input.authorAvatar,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  await query(
    `INSERT INTO discussions (id, benchmark_id, author, author_avatar, body, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [post.id, post.benchmarkId, post.author, post.authorAvatar ?? null, post.body, post.createdAt],
  );
  return post;
}
