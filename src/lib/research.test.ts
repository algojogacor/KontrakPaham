import { describe, expect, mock, test } from "bun:test";

let plannerCalls = 0;

mock.module("@/lib/llm", () => ({
  createChatCompletion: async () => {
    plannerCalls += 1;
    throw new Error("planner should not run when the local corpus has a hit");
  },
}));

mock.module("@/lib/legal-corpus", () => ({
  searchLegalCorpus: async () => ({
    enabled: true,
    query: "klausul denda kontrak",
    content: "Pasal lokal yang relevan",
    sources: [],
    latencyMs: 2,
    confidence: "medium",
  }),
}));

mock.module("@/lib/research-cache", () => ({
  getCachedLegalResearch: async () => null,
  saveLegalResearchCache: async () => undefined,
}));

process.env.YOU_RESEARCH_ENABLED = "true";
process.env.YOU_API_KEY = "test-key";

const { buildLegalResearchContext } = await import("./research");

describe("synchronous legal research", () => {
  test("uses a confident local corpus hit before the slow research planner", async () => {
    const result = await buildLegalResearchContext(
      "Kontrak pinjaman dengan denda keterlambatan.",
      "ADMIN",
    );

    expect(plannerCalls).toBe(0);
    expect(result.content).toContain("Pasal lokal yang relevan");
    expect(result.warning).toContain("planner dan You.com tidak dipanggil");
  });
});
