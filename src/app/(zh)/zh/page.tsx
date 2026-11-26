import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = { alternates: alternates("zh", "/") };

export default function HomePageZh() {
  return <HomeView lang="zh" />;
}
