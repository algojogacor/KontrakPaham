import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Load native/tricky packages from node_modules at runtime instead of bundling.
  // @napi-rs/canvas (native binary), mammoth, pdfjs-dist all externalized.
  // pdfjs worker is loaded via data: URL in documents.ts to bypass Turbopack mangling.
  serverExternalPackages: [
    "@napi-rs/canvas",
    "pdfjs-dist",
    "mammoth",
    "bcryptjs",
    "tesseract.js",
  ],
};

export default nextConfig;
