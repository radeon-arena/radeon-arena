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

export function isTab(k: string | undefined): k is TabKey {
  return !!k && TABS.some((t) => t.key === k);
}
