import { describe, expect, test } from "bun:test";
import {
  buildResearchCacheKey,
  estimateResearchCacheBytes,
  isResearchCacheFresh,
  normalizeResearchQuery,
} from "./research-cache";

describe("research cache helpers", () => {
  test("normalizes legal research query before hashing", () => {
    expect(normalizeResearchQuery("  Denda   kontrak\nIndonesia  ")).toBe(
      "denda kontrak indonesia",
    );
  });

  test("builds stable cache keys for equivalent queries and effort", () => {
    const a = buildResearchCacheKey({
      query: "Denda   kontrak Indonesia",
      effort: "standard",
    });
    const b = buildResearchCacheKey({
      query: " denda kontrak indonesia ",
      effort: "standard",
    });
    const c = buildResearchCacheKey({
      query: "denda kontrak indonesia",
      effort: "deep",
    });

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test("treats old cached research as stale", () => {
    const now = new Date("2026-07-09T00:00:00.000Z");

    expect(
      isResearchCacheFresh({
        cachedAt: new Date("2026-07-08T23:00:00.000Z"),
        now,
        ttlMs: 2 * 60 * 60 * 1000,
      }),
    ).toBe(true);

    expect(
      isResearchCacheFresh({
        cachedAt: new Date("2026-07-08T20:00:00.000Z"),
        now,
        ttlMs: 2 * 60 * 60 * 1000,
      }),
    ).toBe(false);
  });

  test("estimates cache bytes from query, content, and sources", () => {
    expect(
      estimateResearchCacheBytes({
        query: "abc",
        content: "12345",
        sources: [{ title: "UU", url: "https://peraturan.bpk.go.id/" }],
      }),
    ).toBeGreaterThan(8);
  });
});
