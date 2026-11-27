import type { BlogPost } from "./blogUi";
import { ENGINE_POSTS, ENGINE_POSTS_ZH, MODEL_POSTS, MODEL_POSTS_ZH } from "./blogModels";
import type { Lang } from "./i18n";

export type { BlogPost } from "./blogUi";

// Hand-written posts. A post belongs here only when every number in it comes
// from our own measurements: this board's leaderboard data or our own tests of
// this site's services. Never borrow numbers from an external write-up.
// (The 2026-11-26 support-agent A/B post was taken down on 2026-11-27; its
// source is in git history.)
const POSTS: BlogPost[] = [];

// Chinese version of POSTS. Same facts and numbers; keep the two in step.
const POSTS_ZH: BlogPost[] = [];

const ALL_POSTS: Record<Lang, BlogPost[]> = {
  en: [...POSTS, ...ENGINE_POSTS, ...MODEL_POSTS],
  zh: [...POSTS_ZH, ...ENGINE_POSTS_ZH, ...MODEL_POSTS_ZH],
};

// Every post exists in both languages under the same slug; fail the build otherwise.
if (ALL_POSTS.en.map((p) => p.slug).join(",") !== ALL_POSTS.zh.map((p) => p.slug).join(",")) {
  throw new Error("English and Chinese blog posts are out of sync");
}

// Newest first; posts with the same date keep the order above.
export function allPosts(lang: Lang = "en"): BlogPost[] {
  return [...ALL_POSTS[lang]].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string, lang: Lang = "en"): BlogPost | undefined {
  return ALL_POSTS[lang].find((p) => p.slug === slug);
}
