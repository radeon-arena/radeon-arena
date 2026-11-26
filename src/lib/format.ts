export function fmtTps(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  if (n >= 10000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function fmtMs(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ms`;
}

export function fmtDate(iso: string | undefined, lang: "en" | "zh" = "en"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function rankBadge(rank: number): string {
  if (rank === 1) return "text-amber-500";
  if (rank === 2) return "text-zinc-400";
  if (rank === 3) return "text-orange-600";
  return "text-zinc-500";
}
