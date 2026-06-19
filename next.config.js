/** @type {import('next').NextConfig} */
const BUILD_TIME = new Date().toISOString();

const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone/server.js) so the
  // app can run in a minimal Node container with no node_modules at runtime.
  output: "standalone",
  // Baked into the client bundle at build time so the UI can show which build
  // is loaded (also serves as a cache-busting version marker per deploy).
  env: {
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIME,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "huggingface.co" },
    ],
  },
  // Never let a browser/proxy serve a stale HTML document: always re-fetch the
  // document (which references the current, content-hashed JS chunks). Static
  // assets under /_next/static keep their immutable long-cache.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|icon.svg|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
