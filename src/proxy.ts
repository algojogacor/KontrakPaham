import { NextRequest, NextResponse } from "next/server";

/**
 * Global middleware:
 * - Request body size limit for /api/analyze (protects against oversized uploads
 *   that could exhaust memory — the route also checks file size, but this is a
 *   fast early-reject at the edge before the request body is fully read).
 * - Adds basic security headers as defense-in-depth (also set in next.config.ts).
 */
const MAX_ANALIZE_BODY = 25 * 1024 * 1024; // 25MB hard cap (route enforces plan-based 5/20MB)

export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // Body size guard for analyze endpoint
  if (url.pathname === "/api/analyze") {
    const cl = Number(req.headers.get("content-length") || 0);
    if (cl > MAX_ANALIZE_BODY) {
      return NextResponse.json(
        { error: "Ukuran unggahan melebihi batas maksimal (25 MB)." },
        { status: 413 }
      );
    }
  }

  const res = NextResponse.next();
  // Defense-in-depth security headers (also in next.config.ts)
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
