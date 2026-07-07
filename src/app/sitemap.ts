import type { MetadataRoute } from "next";
import { HARDWARE } from "@/lib/hardware";
import { TABS } from "@/lib/tabs";

const BASE_URL = "https://radeon-arena.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/blogs", "/terms", "/privacy", "/data-policy"];
  const hardwareRoutes = HARDWARE.flatMap((hardware) => [
    `/${hardware.key}`,
    ...TABS.map((tab) => `/${hardware.key}/${tab.key}`),
  ]);

  return [...staticRoutes, ...hardwareRoutes].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
  }));
}