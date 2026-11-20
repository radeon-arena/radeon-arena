import type { MetadataRoute } from "next";

const BASE_URL = "https://radeon-arena.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/docs",
    "/blogs",
    "/terms",
    "/privacy",
    "/data-policy",
    "/strix",
    "/strix/leaderboard",
    "/strix/recipes",
    "/strix/submit",
    "/r9700",
    "/r9700/leaderboard",
    "/r9700/recipes",
    "/r9700/submit",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
  }));
}