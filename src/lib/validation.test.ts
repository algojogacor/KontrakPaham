import { describe, expect, test } from "bun:test";
import { sanitizeText } from "./validation";

describe("validation helpers", () => {
  describe("sanitizeText", () => {
    test("returns standard text unchanged", () => {
      const input = "This is a normal contract text.";
      expect(sanitizeText(input)).toBe(input);
    });

    test("strips HTML tags", () => {
      const input = "This is <b>bold</b> and has a <script>alert(1)</script>.";
      expect(sanitizeText(input)).toBe("This is bold and has a alert(1).");
    });

    test("strips null bytes", () => {
      const input = "Text with \u0000 null bytes.";
      expect(sanitizeText(input)).toBe("Text with  null bytes.");
    });

    test("truncates input exceeding 200,000 characters", () => {
      const input = "a".repeat(200_005);
      const expected = "a".repeat(200_000);
      expect(sanitizeText(input)).toBe(expected);
    });
  });
});
