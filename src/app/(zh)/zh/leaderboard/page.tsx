import { redirect } from "next/navigation";

// Same as the English /leaderboard: the board lives at /zh/strix/leaderboard.
export default function LegacyLeaderboardZh() {
  redirect("/zh/strix/leaderboard");
}
