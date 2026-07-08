import { describe, expect, test } from "bun:test";
import { friendlyError, ApiError } from "./api-client";

describe("friendlyError", () => {
  describe("when given an ApiError", () => {
    test("returns correct message for status 429", () => {
      const error = new ApiError("Too many requests", 429);
      expect(friendlyError(error)).toBe("Anda terlalu sering mencoba. Tunggu sebentar lalu coba lagi.");
    });

    test("returns correct message for status 401", () => {
      const error = new ApiError("Unauthorized", 401);
      expect(friendlyError(error)).toBe("Sesi Anda berakhir. Silakan masuk kembali.");
    });

    test("returns error message for status 402", () => {
      const error = new ApiError("Payment required", 402);
      expect(friendlyError(error)).toBe("Payment required");
    });

    test("returns error message for status 413", () => {
      const error = new ApiError("Payload too large", 413);
      expect(friendlyError(error)).toBe("Payload too large");
    });

    test("returns error message for other ApiError statuses", () => {
      const error = new ApiError("Some other api error", 500);
      expect(friendlyError(error)).toBe("Some other api error");
    });
  });

  describe("when given a standard Error", () => {
    test("returns correct message for 'Failed to fetch'", () => {
      const error = new Error("Failed to fetch");
      expect(friendlyError(error)).toBe("Koneksi terputus. Periksa internet Anda lalu coba lagi.");
    });

    test("returns error message for other Error messages", () => {
      const error = new Error("Some standard error");
      expect(friendlyError(error)).toBe("Some standard error");
    });
  });

  describe("when given unknown error types", () => {
    test("returns generic error message for strings", () => {
      expect(friendlyError("Just a string")).toBe("Terjadi kesalahan tak terduga. Silakan coba lagi.");
    });

    test("returns generic error message for objects", () => {
      expect(friendlyError({ some: "object" })).toBe("Terjadi kesalahan tak terduga. Silakan coba lagi.");
    });

    test("returns generic error message for null", () => {
      expect(friendlyError(null)).toBe("Terjadi kesalahan tak terduga. Silakan coba lagi.");
    });
  });
});
