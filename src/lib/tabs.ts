// Tab definitions for the leaderboard. Kept in a plain (non-"use client")
// module so server components (the /[hw] route and the legacy redirect) can
// import `isTab`/`TABS` safely — importing non-component exports from a
// "use client" module yields client-reference proxies that aren't callable.

export const TABS = [
  { key: "leaderboard", label: "LLM Leaderboard" },
  { key: "recipes", label: "Recipes" },
  { key: "users", label: "Users" },
  { key: "submit", label: "Submit Recipe" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

/**
 * Tabs hidden from the nav but still valid routes. The "Users" (contributor)
 * leaderboard is hidden until community submissions accumulate distinct
 * contributors — every current result is first-party RadeonArena-fleet data, so
 * the view would collapse to a single misleading row. Hidden tabs are not
 * statically generated, so their URLs return 404. Drop "users" from this list
 * to bring the tab and its pages back once user-submitted results exist.
 */
export const HIDDEN_TAB_KEYS: readonly TabKey[] = ["users"];

/** Tabs shown in the nav and generated as pages. */
export const VISIBLE_TABS = TABS.filter((t) => !HIDDEN_TAB_KEYS.includes(t.key));

export function isTab(k: string | undefined): k is TabKey {
  return !!k && TABS.some((t) => t.key === k);
}
