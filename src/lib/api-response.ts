import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Structured API response helpers.
 * All error responses include: { error, code, requestId }
 * Success responses pass through as-is but with X-Request-ID header.
 */

export interface ApiError {
  error: string;
  code: string;
  requestId: string;
}

/** Generate a request ID (UUID) for tracing. */
export function newRequestId(): string {
  return randomUUID();
}

/** Return a structured error response with request ID + status code. */
export function apiError(
  message: string,
  status: number,
  opts: { code?: string; requestId?: string; data?: Record<string, unknown> } = {}
) {
  const requestId = opts.requestId || newRequestId();
  const body: ApiError = {
    error: message,
    code: opts.code || defaultCodeForStatus(status),
    requestId,
  };
  const res = NextResponse.json(
    opts.data ? { ...body, ...opts.data } : body,
    { status }
  );
  res.headers.set("X-Request-ID", requestId);
  return res;
}

/** Return a success response with request ID header. */
export function apiOk(data: unknown, opts: { requestId?: string } = {}) {
  const requestId = opts.requestId || newRequestId();
  const res = NextResponse.json(data);
  res.headers.set("X-Request-ID", requestId);
  return res;
}

function defaultCodeForStatus(status: number): string {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "UNAUTHORIZED";
    case 402: return "QUOTA_EXCEEDED";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 409: return "CONFLICT";
    case 413: return "PAYLOAD_TOO_LARGE";
    case 415: return "UNSUPPORTED_MEDIA_TYPE";
    case 422: return "UNPROCESSABLE_ENTITY";
    case 429: return "RATE_LIMITED";
    case 500: return "INTERNAL_ERROR";
    default: return "ERROR";
  }
}
