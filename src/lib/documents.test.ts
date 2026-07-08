import { describe, expect, test, mock } from "bun:test";

mock.module("@/lib/logger", () => ({
  logger: {
    info: () => {},
    error: () => {},
    warn: () => {},
  },
}));

import { validateContractText } from "./documents";

describe("documents helpers", () => {
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
});
