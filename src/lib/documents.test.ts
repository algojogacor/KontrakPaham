import { describe, expect, test, mock } from "bun:test";

// Mock logger before importing documents module
mock.module("@/lib/logger", () => ({
  logger: {
    info: () => {},
    error: () => {},
    warn: () => {},
  },
}));

import { indonesianScore, validateContractText } from "./documents";

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
    const text = "bermain membaca mencari pencuri perdana sebagai";
    const score = indonesianScore(text);
    expect(score).toBeCloseTo(0.23, 2);
  });

  test("calculates score correctly with suffix matches", () => {
    const text = "jalankan mainan turuti";
    const score = indonesianScore(text);
    expect(score).toBeCloseTo(0.08, 2);
  });

  test("returns 0 for purely non-Indonesian text", () => {
    const text = "The quick brown fox jumps over the lazy dog in a completely different language.";
    expect(indonesianScore(text)).toBe(0);
  });

  test("handles punctuation correctly by stripping non-alphabetical characters", () => {
    const text = "yang, dan... atau?!";
    const score = indonesianScore(text);
    expect(score).toBeCloseTo(0.2, 2);
  });

  test("caps the score at 1.0", () => {
    const text = "yang dan atau di ke dari untuk pada dengan adalah akan oleh secara ini itu";
    const score = indonesianScore(text);
    expect(score).toBe(1);

    const text2 = text + " " + text;
    expect(indonesianScore(text2)).toBe(1);
  });

  test("is case-insensitive", () => {
    const text1 = "YANG DAN ATAU DI KE";
    const text2 = "yang dan atau di ke";
    expect(indonesianScore(text1)).toBe(indonesianScore(text2));
  });
});

describe("validateContractText", () => {
  test("rejects text that is too short", () => {
    const warnings: string[] = [];
    const text = "a".repeat(59);
    const result = validateContractText(text, warnings);
    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      "Teks kontrak terlalu pendek atau kosong. Pastikan Anda mengunggah dokumen kontrak yang utuh.",
    );
    expect(warnings).toHaveLength(0);
  });

  test("accepts text but warns if it does not seem to be Indonesian", () => {
    const warnings: string[] = [];
    const text =
      "apple orange banana grape cherry strawberry melon lemon kiwi peach apple orange banana grape cherry strawberry melon lemon kiwi peach apple orange banana grape cherry strawberry melon lemon kiwi peach apple orange banana grape cherry strawberry melon lemon kiwi peach";
    const result = validateContractText(text, warnings);
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toBe(
      "Bahasa pada dokumen sepertinya bukan Bahasa Indonesia. Analisis tetap dilakukan, namun hasil mungkin kurang akurat.",
    );
  });

  test("accepts text without warnings if it appears to be valid Indonesian", () => {
    const warnings: string[] = [];
    const text =
      "Surat Perjanjian Sewa Menyewa. Pada hari ini, pihak pertama dan pihak kedua sepakat untuk mengadakan perjanjian sewa menyewa dengan syarat dan ketentuan sebagai berikut. Pihak kedua wajib membayar harga sewa sebesar rupiah yang telah disepakati. Apabila terjadi keterlambatan, maka akan dikenakan denda sesuai pasal yang berlaku.";
    const result = validateContractText(text, warnings);
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(warnings).toHaveLength(0);
  });
});
