import { redirect } from "next/navigation";

// Backward-compat: old /leaderboard links now live at /strix/leaderboard.
export default function LegacyLeaderboard() {
  redirect("/strix/leaderboard");
}
