import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/blog";

const BASE_URL = "https://radeon-arena.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/local-helper",
    "/docs",
    "/blog",
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
    "/w7900",
    "/w7900/leaderboard",
    "/w7900/recipes",
    "/w7900/submit",
  ];
  // Blog posts keep the trailing slash their canonical URL has always had.
  const posts = allPosts().map((p) => `/blog/${p.slug}/`);

  // Every page exists in English (root) and Chinese (/zh); list both, each
  // with hreflang links to the other.
  const zh = (route: string) => (route === "" ? "/zh" : `/zh${route}`);
  return [...routes, ...posts].flatMap((route) => {
    const languages = {
      en: `${BASE_URL}${route}`,
      "zh-CN": `${BASE_URL}${zh(route)}`,
      "x-default": `${BASE_URL}${route}`,
    };
    return [route, zh(route)].map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      alternates: { languages },
    }));
  });
}