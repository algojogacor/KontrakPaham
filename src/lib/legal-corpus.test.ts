import { describe, expect, test } from "bun:test";
import {
  buildLegalCorpusContext,
  extractLegalIssueSignals,
  normalizeLegalSearchText,
  scoreLegalArticle,
  parseStoredTags,
} from "./legal-corpus";

describe("legal corpus helpers", () => {
  test("normalizes layperson wording into searchable text", () => {
    expect(normalizeLegalSearchText("  Denda 2% / HARI!!! telat bayar  "))
      .toBe("denda 2 hari telat bayar");
  });

  test("extracts legal issue signals from messy user language", () => {
    const signals = extractLegalIssueSignals(
      "Kalau telat bayar dendanya gede banget dan kontrak bisa diputus sepihak.",
    );

    expect(signals.tags).toContain("denda");
    expect(signals.tags).toContain("pemutusan_sepihak");
    expect(signals.keywords).toContain("telat bayar");
  });

  test("maps layperson complaints into comprehensive legal tag families", () => {
    const signals = extractLegalIssueSignals(
      "Akun saya tiba-tiba dibekukan, saldo ditahan, data KTP dipakai, refund ditolak, katanya semua risiko saya tanggung.",
    );

    expect(signals.tags).toContain("suspensi_akun");
    expect(signals.tags).toContain("data_pribadi");
    expect(signals.tags).toContain("refund");
    expect(signals.tags).toContain("pengalihan_risiko");
    expect(signals.tagFamilies).toEqual(
      expect.arrayContaining([
        "digital_and_platform",
        "privacy_and_data",
        "payment_and_penalty",
        "risk_allocation",
      ]),
    );
  });

  test("scores exact tags higher than loose keyword matches", () => {
    const score = scoreLegalArticle(
      {
        tags: ["klausul_baku", "denda"],
        normalizedText: "pasal klausul baku denda konsumen",
      },
      {
        tags: ["denda"],
        keywords: ["denda telat bayar"],
        normalizedQuery: "denda telat bayar sepihak",
        tagFamilies: ["payment_and_penalty"],
      },
    );

    expect(score).toBeGreaterThanOrEqual(12);
  });

  test("formats legal corpus context with citation and source url", () => {
    const context = buildLegalCorpusContext([
      {
        documentTitle: "UU Perlindungan Konsumen",
        articleNumber: "Pasal 18",
        articleText: "Pelaku usaha dilarang mencantumkan klausul baku tertentu.",
        plainSummary: "Klausul baku yang terlalu sepihak dapat bermasalah.",
        sourceUrl: "https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999",
        score: 18,
      },
    ]);

    expect(context.content).toContain("UU Perlindungan Konsumen Pasal 18");
    expect(context.content).toContain("https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999");
    expect(context.sources[0]?.url).toContain("peraturan.bpk.go.id");
  });

  test("parses article tags from stored JSON", () => {
    const row = {
      tags: '["denda","klausul_baku"]',
      normalizedText: "denda klausul baku",
    };

    expect(parseStoredTags(row.tags)).toEqual(["denda", "klausul_baku"]);
  });
});
