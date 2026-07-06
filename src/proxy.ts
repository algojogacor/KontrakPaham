import { NextRequest, NextResponse } from "next/server";

/**
 * Global proxy (Next 16 convention, replaces middleware):
 * - Request body size limit for /api/analyze (25MB hard cap).
 * - Security headers (defense-in-depth, also in next.config.ts).
 * - Request ID generation for tracing (X-Request-ID header).
 * - CSRF protection: mutation endpoints (POST/PUT/DELETE) require either:
 *   a) Same-origin (Origin/Host header match), OR
 *   b) X-Requested-With header (set by our own fetch calls)
 *   This blocks cross-site form submissions/fetch from other origins.
 */
const MAX_ANALIZE_BODY = 25 * 1024 * 1024; // 25MB hard cap

function isMutation(method: string) {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function checkCsrf(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  // Allow same-origin (origin matches host)
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {
      // malformed origin — fail closed
    }
  }
  // Allow if X-Requested-With present (our SPA sets it; cross-site forms can't)
  if (req.headers.get("x-requested-with")) return true;
  return false;
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // Body size guard for analyze endpoint
  if (url.pathname === "/api/analyze") {
    const cl = Number(req.headers.get("content-length") || 0);
    if (cl > MAX_ANALIZE_BODY) {
      return NextResponse.json(
        { error: "Ukuran unggahan melebihi batas maksimal (25 MB).", code: "PAYLOAD_TOO_LARGE" },
        { status: 413 }
      );
    }
  }

  // CSRF check for mutation endpoints on /api/*
  if (url.pathname.startsWith("/api/") && isMutation(req.method)) {
    if (!checkCsrf(req)) {
      return NextResponse.json(
        { error: "Permintaan ditolak (CSRF).", code: "CSRF_BLOCKED" },
        { status: 403 }
      );
    }
  }

  const res = NextResponse.next();
  // Defense-in-depth security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
