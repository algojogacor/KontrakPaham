import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Load native/tricky packages from node_modules at runtime instead of bundling.
  // NOTE: pdfjs-dist is intentionally NOT externalized — it is pure ESM (.mjs) and
  // cannot be require()'d by Node's CJS runtime. Turbopack must bundle it as ESM.
  // @napi-rs/canvas stays external because it has native .node binaries.
  serverExternalPackages: [
    "@napi-rs/canvas",
    "mammoth",
    "bcryptjs",
    "sharp",
  ],
  // Security headers — applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
