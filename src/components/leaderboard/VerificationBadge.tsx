import type { VerificationStatus } from "@/lib/types";

const STATUS: Record<
  VerificationStatus,
  { label: string; cls: string; icon: string; title: string }
> = {
  self: {
    label: "First-party",
    cls: "border-ink-600 bg-ink-800 text-zinc-400",
    icon: "★",
    title: "Measured by RadeonArena's own runner — first-party, trusted",
  },
  verified: {
    label: "Verified",
    cls: "border-emerald-700/50 bg-emerald-950/40 text-emerald-300",
    icon: "✓",
    title: "A runner reran this recipe and matched the reported value",
  },
  pending: {
    label: "Pending",
    cls: "border-amber-700/50 bg-amber-950/40 text-amber-300",
    icon: "…",
    title: "User-submitted — awaiting a verification rerun",
  },
  failed: {
    label: "Repro failed",
    cls: "border-rose-700/50 bg-rose-950/40 text-rose-300",
    icon: "⚠",
    title:
      "A rerun did not match the reported value. Kept on the board and open for discussion (not removed).",
  },
};

/** Verification-status pill shown on the leaderboard and in the detail modal (DESIGN.md §4). */
export function VerificationBadge({
  status,
  className = "",
}: {
  status?: VerificationStatus;
  className?: string;
}) {
  const s = STATUS[status ?? "self"];
  return (
    <span
      title={s.title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${s.cls} ${className}`}
    >
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}
