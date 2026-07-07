import type { MetadataRoute } from "next";

const BASE_URL = "https://radeon-arena.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/blogs",
    "/terms",
    "/privacy",
    "/data-policy",
    "/strix",
    "/strix/leaderboard",
    "/strix/recipes",
    "/strix/submit",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
  }));
}