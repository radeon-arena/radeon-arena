import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://radeon-arena.com"),
  title: "Radeon Arena - LLM Leaderboard",
  description:
    "LLM benchmark leaderboard for models running on AMD Radeon GPUs. Built with rocm-vllm-docker and llama-benchy by the Radeon community.",
  keywords: ["LLM", "benchmark", "AMD", "Radeon", "ROCm", "vLLM", "SGLang", "llama.cpp", "llama-benchy"],
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
