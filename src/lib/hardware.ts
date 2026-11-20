// Hardware axis shared by the leaderboard page, its sub-views, and the
// per-hardware API routes. A hardware tab scopes every active view (leaderboard,
// recipes, submit) to the GPUs whose `gpu` string it matches.

export type Hardware = {
  key: string;
  label: string;
  short: string;
  sub: string;
  disabled?: boolean;
  match: (gpu: string) => boolean;
};

export const HARDWARE: Hardware[] = [
  { key: "r9700", label: "Radeon AI PRO R9700", short: "R9700", sub: "RDNA4 · gfx1201", match: (g) => /r9700/i.test(g) },
  { key: "strix", label: "Strix Halo", short: "Strix Halo", sub: "Radeon 8060S · gfx1151", match: (g) => /strix|8060s|gfx1151/i.test(g) },
  { key: "w7900", label: "Radeon PRO W7900", short: "W7900", sub: "RDNA3 · gfx1100", match: (g) => /w7900/i.test(g) },
];

// Tabs are ordered newest architecture first (RDNA4, RDNA3.5, RDNA3); the
// default tab stays Strix Halo, which the site links to as /strix.
export const DEFAULT_HW = "strix";

export function resolveHw(key: string | null | undefined): string {
  return HARDWARE.some((h) => h.key === key) ? (key as string) : DEFAULT_HW;
}

export function hwLabel(key: string): string {
  return HARDWARE.find((h) => h.key === key)?.label ?? key;
}

/** True if a benchmark/entry's GPU string belongs under the given hardware tab. */
export function hwMatches(key: string, gpu: string | undefined): boolean {
  const h = HARDWARE.find((x) => x.key === key);
  return h ? h.match(gpu ?? "") : true;
}
