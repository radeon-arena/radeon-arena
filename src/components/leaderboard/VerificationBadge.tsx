"use client";

import { useLang } from "@/components/LangProvider";
import type { VerificationStatus } from "@/lib/types";

const STATUS: Record<
  VerificationStatus,
  { label: string; cls: string; icon: string; title: string; labelZh: string; titleZh: string }
> = {
  self: {
    label: "First-party",
    cls: "border-ink-600 bg-ink-800 text-zinc-400",
    icon: "★",
    title: "Measured by RadeonArena's own runner — first-party, trusted",
    labelZh: "本站实测",
    titleZh: "由 Radeon Arena 自有测试机实测，可信",
  },
  verified: {
    label: "Verified",
    cls: "border-emerald-300 bg-emerald-50 text-emerald-700",
    icon: "✓",
    title: "A runner reran this recipe and matched the reported value",
    labelZh: "已验证",
    titleZh: "测试机复测了这份配方，结果与提交的数值一致",
  },
  pending: {
    label: "Pending",
    cls: "border-amber-300 bg-amber-50 text-amber-700",
    icon: "…",
    title: "User-submitted — awaiting a verification rerun",
    labelZh: "待验证",
    titleZh: "用户提交，等待复测",
  },
  failed: {
    label: "Repro failed",
    cls: "border-rose-300 bg-rose-50 text-rose-700",
    icon: "⚠",
    title:
      "A rerun did not match the reported value. Kept on the board and open for discussion (not removed).",
    labelZh: "复现未通过",
    titleZh: "复测结果与提交的数值不一致。保留在榜单上待讨论，不删除。",
  },
};

/** Verification-status pill shown on the leaderboard and in the detail modal. */
export function VerificationBadge({
  status,
  className = "",
}: {
  status?: VerificationStatus;
  className?: string;
}) {
  const s = STATUS[status ?? "self"];
  const zh = useLang() === "zh";
  return (
    <span
      title={zh ? s.titleZh : s.title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${s.cls} ${className}`}
    >
      <span aria-hidden>{s.icon}</span>
      {zh ? s.labelZh : s.label}
    </span>
  );
}
