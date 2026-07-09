import { LEGAL_TAG_DEFINITIONS } from "@/lib/legal-taxonomy";
import type { ResearchSource } from "@/lib/research";
import { db } from "@/lib/db";

export interface LegalIssueSignals {
  normalizedQuery: string;
  tags: string[];
  tagFamilies: string[];
  keywords: string[];
}

export interface LegalArticleSearchRow {
  tags: string[];
  normalizedText: string;
}

export interface LegalCorpusResult {
  documentTitle: string;
  articleNumber: string;
  articleText: string;
  plainSummary: string | null;
  sourceUrl: string | null;
  score: number;
}

export interface LegalCorpusContext {
  enabled: boolean;
  query: string;
  content: string;
  sources: ResearchSource[];
  latencyMs: number;
  confidence: "low" | "medium" | "high";
}

export function normalizeLegalSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractLegalIssueSignals(text: string): LegalIssueSignals {
  const normalizedQuery = normalizeLegalSearchText(text);
  const tags = new Set<string>();
  const tagFamilies = new Set<string>();
  const keywords = new Set<string>();

  for (const definition of LEGAL_TAG_DEFINITIONS) {
    for (const phrase of definition.aliases) {
      if (normalizedQuery.includes(normalizeLegalSearchText(phrase))) {
        tags.add(definition.tag);
        tagFamilies.add(definition.family);
        keywords.add(phrase);
      }
    }
  }

  for (const token of normalizedQuery.split(" ")) {
    if (token.length >= 5) keywords.add(token);
  }

  return {
    normalizedQuery,
    tags: [...tags],
    tagFamilies: [...tagFamilies],
    keywords: [...keywords].slice(0, 24),
  };
}

export function scoreLegalArticle(row: LegalArticleSearchRow, signals: LegalIssueSignals) {
  let score = 0;
  const rowTags = new Set(row.tags);
  for (const tag of signals.tags) {
    if (rowTags.has(tag)) score += 12;
  }
  for (const keyword of signals.keywords) {
    if (row.normalizedText.includes(normalizeLegalSearchText(keyword))) score += 2;
  }
  if (signals.normalizedQuery && row.normalizedText.includes(signals.normalizedQuery)) score += 8;
  return score;
}

export function confidenceFromScore(score: number): LegalCorpusContext["confidence"] {
  if (score >= 18) return "high";
  if (score >= 8) return "medium";
  return "low";
}

export function buildLegalCorpusContext(results: LegalCorpusResult[]): LegalCorpusContext {
  const top = results.slice(0, 6);
  const bestScore = top[0]?.score || 0;
  const sources = top
    .filter((item) => item.sourceUrl)
    .map((item) => ({
      title: `${item.documentTitle} ${item.articleNumber}`,
      url: item.sourceUrl as string,
    }));

  const content = top
    .map((item, index) => {
      const summary = item.plainSummary ? `Ringkasan: ${item.plainSummary}\n` : "";
      const source = item.sourceUrl ? `Sumber: ${item.sourceUrl}\n` : "";
      return `${index + 1}. ${item.documentTitle} ${item.articleNumber}\n${summary}Teks: ${item.articleText}\n${source}Skor: ${item.score}`;
    })
    .join("\n\n");

  return {
    enabled: top.length > 0,
    query: "",
    content,
    sources,
    latencyMs: 0,
    confidence: confidenceFromScore(bestScore),
  };
}

export function parseStoredTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function searchLegalCorpus(text: string, limit = 6): Promise<LegalCorpusContext | null> {
  const started = Date.now();
  const signals = extractLegalIssueSignals(text);
  
  // Combine tags and query words into unique tokens
  const queryWords = signals.normalizedQuery.split(" ").filter(w => w.length >= 3);
  const uniqueTokens = [...new Set([...signals.tags, ...queryWords])];
  if (!uniqueTokens.length) return null;

  // Build FTS MATCH query joined by OR
  const ftsQuery = uniqueTokens
    .map(t => `"${t.replace(/"/g, '""')}"`)
    .join(" OR ");

  const results = await db.$queryRaw<any[]>`
    SELECT 
      a.id,
      a."documentId" AS documentId,
      a."articleNumber" AS articleNumber,
      a.title,
      a.text,
      a."plainSummary" AS plainSummary,
      a.tags,
      a."sourceUrl" AS sourceUrl,
      d.title AS documentTitle,
      fts.rank AS rank
    FROM "LegalArticle" a
    JOIN "LegalDocument" d ON a."documentId" = d.id
    JOIN "LegalArticleFts" fts ON a.rowid = fts.rowid
    WHERE "LegalArticleFts" MATCH ${ftsQuery}
    ORDER BY fts.rank ASC
    LIMIT ${limit};
  `;

  if (!results.length) return null;

  const formattedResults: LegalCorpusResult[] = results.map((row) => ({
    documentTitle: row.documentTitle || "",
    articleNumber: row.articleNumber || "",
    articleText: row.text || "",
    plainSummary: row.plainSummary || null,
    sourceUrl: row.sourceUrl || null,
    score: scoreLegalArticle(
      { tags: parseStoredTags(row.tags), normalizedText: `${row.text} ${row.plainSummary || ""} ${row.tags}` },
      signals
    )
  }));

  const sortedResults = formattedResults.sort((a, b) => b.score - a.score);
  const context = buildLegalCorpusContext(sortedResults);

  return {
    ...context,
    query: signals.normalizedQuery,
    latencyMs: Date.now() - started,
    enabled: true,
  };
}
