import { describe, expect, test } from "bun:test";
import { formatZodErrors } from "../validation";
import { z } from "zod";

describe("formatZodErrors", () => {
  test("returns default message for empty issues", () => {
    const error = new z.ZodError([]);
    expect(formatZodErrors(error)).toBe("Input tidak valid");
  });

  test("formats single issue with empty path", () => {
    const error = new z.ZodError([
      {
        code: "custom",
        path: [],
        message: "Invalid format",
      },
    ]);
    expect(formatZodErrors(error)).toBe("input: Invalid format");
  });

  test("formats single issue with path", () => {
    const error = new z.ZodError([
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["user", "email"],
        message: "Email is required",
      },
    ]);
    expect(formatZodErrors(error)).toBe("user.email: Email is required");
  });

  test("formats multiple issues and joins them with semicolon", () => {
    const error = new z.ZodError([
      {
        code: "too_small",
        minimum: 3,
        type: "string",
        inclusive: true,
        exact: false,
        path: ["username"],
        message: "Username minimal 3 karakter",
      },
      {
        code: "invalid_string",
        validation: "email",
        path: ["email"],
        message: "Format email tidak valid",
      },
    ]);
    expect(formatZodErrors(error)).toBe(
      "username: Username minimal 3 karakter; email: Format email tidak valid",
    );
  });

  test("formats mixed path lengths", () => {
    const error = new z.ZodError([
      {
        code: "custom",
        path: [],
        message: "Root level error",
      },
      {
        code: "custom",
        path: ["nested", "field"],
        message: "Nested error",
      },
    ]);
    expect(formatZodErrors(error)).toBe(
      "input: Root level error; nested.field: Nested error",
    );
  });
});
