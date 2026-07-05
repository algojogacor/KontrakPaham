import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Load native/tricky packages from node_modules at runtime instead of bundling.
  // Fixes @napi-rs/canvas native binary resolution & pdfjs worker resolution.
  serverExternalPackages: [
    "@napi-rs/canvas",
    "pdfjs-dist",
    "mammoth",
    "bcryptjs",
  ],
};

export default nextConfig;
