import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  excerpt: string;
  tags: string[];
  readingMinutes: number;
  content: ReactNode;
};

// No posts yet. A post belongs here only when every number in it is
// reproducible from this site's own leaderboard data — not borrowed from
// an external write-up.
const POSTS: BlogPost[] = [];

export function allPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
