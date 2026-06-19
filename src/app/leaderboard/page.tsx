import { redirect } from "next/navigation";
import { resolveHw } from "@/lib/hardware";
import { isTab } from "@/lib/tabs";

// Backward-compat: old /leaderboard?tab=&hw= links now live at /{hw}/{tab}.
export default function LegacyLeaderboard({
  searchParams,
}: {
  searchParams: { tab?: string; hw?: string };
}) {
  const hw = resolveHw(searchParams.hw);
  const tab = isTab(searchParams.tab) ? searchParams.tab : "leaderboard";
  redirect(`/${hw}/${tab}`);
}
