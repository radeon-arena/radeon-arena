export function fmtTps(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  if (n >= 10000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function fmtMs(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} ms`;
}

export function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function rankBadge(rank: number): string {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-orange-400";
  return "text-zinc-500";
}
