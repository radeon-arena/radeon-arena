import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FirstPartyAnalytics } from "@/components/FirstPartyAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://radeon-arena.com"),
  title: "Radeon Arena - LLM Leaderboard",
  description:
    "LLM inference benchmarks measured on AMD Radeon GPUs (vLLM and llama.cpp on ROCm), and an A2A API for ROCm and local LLM support questions.",
  keywords: ["LLM", "benchmark", "AMD", "Radeon", "ROCm", "RDNA", "vLLM", "llama.cpp", "A2A", "API", "ROCm FAQ"],
  applicationName: "Radeon Arena",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Radeon Arena - LLM Leaderboard",
    description: "LLM benchmark leaderboard for AMD Radeon GPUs",
    type: "website",
    url: "https://radeon-arena.com",
  },
  twitter: {
    card: "summary",
    title: "Radeon Arena - LLM Leaderboard",
    description: "LLM benchmark leaderboard for AMD Radeon GPUs",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <FirstPartyAnalytics />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
