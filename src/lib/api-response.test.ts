import { describe, expect, test } from "bun:test";
import { newRequestId, apiError, apiOk } from "./api-response";
import { NextResponse } from "next/server";

describe("api-response helpers", () => {
  describe("newRequestId", () => {
    test("returns a valid UUID string", () => {
      const reqId = newRequestId();
      expect(typeof reqId).toBe("string");
      expect(reqId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    test("returns unique UUIDs", () => {
      const id1 = newRequestId();
      const id2 = newRequestId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("apiError", () => {
    test("returns a NextResponse with error details and default code", async () => {
      const res = apiError("Something went wrong", 400);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Something went wrong");
      expect(body.code).toBe("BAD_REQUEST");
      expect(body.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(res.headers.get("X-Request-ID")).toBe(body.requestId);
    });

    test("uses provided options", async () => {
      const res = apiError("Not found", 404, {
        code: "CUSTOM_NOT_FOUND",
        requestId: "test-req-id",
        data: { customField: "value" },
      });

      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("Not found");
      expect(body.code).toBe("CUSTOM_NOT_FOUND");
      expect(body.requestId).toBe("test-req-id");
      expect(body.customField).toBe("value");
      expect(res.headers.get("X-Request-ID")).toBe("test-req-id");
    });

    test("default codes map correctly", async () => {
      const statusToCode: Record<number, string> = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        402: "QUOTA_EXCEEDED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        415: "UNSUPPORTED_MEDIA_TYPE",
        422: "UNPROCESSABLE_ENTITY",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
        502: "ERROR",
      };

      for (const [status, code] of Object.entries(statusToCode)) {
        const res = apiError("Test", parseInt(status));
        const body = await res.json();
        expect(body.code).toBe(code);
      }
    });
  });

  describe("apiOk", () => {
    test("returns a NextResponse with data and request ID", async () => {
      const res = apiOk({ success: true, count: 5 });
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ success: true, count: 5 });

      const headerReqId = res.headers.get("X-Request-ID");
      expect(headerReqId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    test("uses provided request ID", async () => {
      const res = apiOk({ success: true }, { requestId: "custom-req-id" });
      expect(res.headers.get("X-Request-ID")).toBe("custom-req-id");
    });
  });
});
