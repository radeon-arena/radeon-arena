import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = { alternates: alternates("en", "/") };

export default function HomePage() {
  return <HomeView lang="en" />;
}
