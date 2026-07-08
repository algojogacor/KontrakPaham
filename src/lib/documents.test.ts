import { describe, expect, test } from "bun:test";
import { indonesianScore } from "./documents";

describe("indonesianScore", () => {
  test("returns 0 for empty text or whitespace", () => {
    expect(indonesianScore("")).toBe(0);
    expect(indonesianScore("    ")).toBe(0);
    expect(indonesianScore("\n\t")).toBe(0);
  });

  test("returns a high score for typical Indonesian contract text", () => {
    const text = "Perjanjian ini adalah kontrak sewa beli dengan pihak yang wajib membayar denda.";
    const score = indonesianScore(text);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThanOrEqual(1);
  });

  test("calculates score correctly with prefix matches", () => {
    // words > 5 chars starting with ber, mem, men, pen, per, se
    // bermain, membaca, mencari, pencuri, perdana, sebagai
    const text = "bermain membaca mencari pencuri perdana sebagai";
    const score = indonesianScore(text);
    // 6 words. length = 6. Max(15, 6 * 0.08) = 15.
    // 'sebagai' is in ID_MARKERS, so it gets hits += 1 instead of 0.5.
    // The rest (5 words) get hits += 0.5.
    // Total hits = 1 + (5 * 0.5) = 3.5.
    // Score = 3.5 / 15 = 0.2333...
    expect(score).toBeCloseTo(0.23, 2);
  });

  test("calculates score correctly with suffix matches", () => {
    // words > 5 chars ending with kan, an, i
    // jalankan, mainan, turuti
    const text = "jalankan mainan turuti";
    const score = indonesianScore(text);
    // 3 words. Max(15, 3 * 0.08) = 15.
    // Each matches suffix. Hits = 3 * 0.4 = 1.2
    // Score = 1.2 / 15 = 0.08
    expect(score).toBeCloseTo(0.08, 2);
  });

  test("returns 0 for purely non-Indonesian text", () => {
    const text = "The quick brown fox jumps over the lazy dog in a completely different language.";
    expect(indonesianScore(text)).toBe(0);
  });

  test("handles punctuation correctly by stripping non-alphabetical characters", () => {
    // "yang", "dan", "atau" are in ID_MARKERS
    const text = "yang, dan... atau?!";
    const score = indonesianScore(text);
    // 3 words. Max(15, 3*0.08) = 15
    // 3 exact matches in ID_MARKERS. Hits = 3
    // Score = 3 / 15 = 0.2
    expect(score).toBeCloseTo(0.2, 2);
  });

  test("caps the score at 1.0", () => {
    // ID_MARKERS = "yang", "dan", "atau", "di", "ke", ...
    // Need at least 15 hits to reach 1.0 since divisor is at least 15
    const text = "yang dan atau di ke dari untuk pada dengan adalah akan oleh secara ini itu";
    const score = indonesianScore(text);
    expect(score).toBe(1);

    // Test with more hits
    const text2 = text + " " + text;
    expect(indonesianScore(text2)).toBe(1);
  });

  test("is case-insensitive", () => {
    const text1 = "YANG DAN ATAU DI KE";
    const text2 = "yang dan atau di ke";
    expect(indonesianScore(text1)).toBe(indonesianScore(text2));
  });
});
