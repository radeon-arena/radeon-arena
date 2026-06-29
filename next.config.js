/** @type {import('next').NextConfig} */
const BUILD_TIME = new Date().toISOString();

const nextConfig = {
  reactStrictMode: true,
  // Pure static export. The browser reads benchmark data directly from the
  // public radeonrun GitHub raw bundle at runtime.
  output: "export",
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
};

module.exports = nextConfig;
