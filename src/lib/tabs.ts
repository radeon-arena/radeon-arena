// Tab definitions for the leaderboard. Kept in a plain (non-"use client")
// module so server components (the /[hw] route and the legacy redirect) can
// import `isTab`/`TABS` safely — importing non-component exports from a
// "use client" module yields client-reference proxies that aren't callable.

export const TABS = [
  { key: "leaderboard", label: "LLM Leaderboard" },
  { key: "users", label: "Users" },
  { key: "organizations", label: "Organizations" },
  { key: "compare", label: "Compare Models" },
  { key: "recipe", label: "Recipe Generator" },
  { key: "submit", label: "Submit Result" },
  { key: "how", label: "How to Benchmark" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

/**
 * Tabs hidden from the nav but still valid routes. The "Users" (contributor)
 * leaderboard is hidden until community submissions accumulate distinct
 * contributors — every current result is first-party RadeonArena-fleet data, so
 * the view would collapse to a single misleading row. Drop "users" from this
 * list to re-surface the tab once user-submitted results exist; the route and
 * UsersView stay intact regardless.
 */
export const HIDDEN_TAB_KEYS: readonly TabKey[] = ["users"];

/** Tabs shown in the nav (hidden ones remain reachable by direct URL). */
export const VISIBLE_TABS = TABS.filter((t) => !HIDDEN_TAB_KEYS.includes(t.key));

export function isTab(k: string | undefined): k is TabKey {
  return !!k && TABS.some((t) => t.key === k);
}
