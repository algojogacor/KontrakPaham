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
  if (!signals.tags.length && !signals.keywords.length) return null;

  const tokens = [...new Set([...signals.tags, ...signals.keywords.map(normalizeLegalSearchText)])]
    .filter((token) => token.length >= 3)
    .slice(0, 24);

  const indexRows = await db.legalArticleIndex.findMany({
    where: {
      OR: [
        { token: { in: tokens } },
        { tag: { in: signals.tags } },
      ],
    },
    include: {
      article: {
        include: { document: true },
      },
    },
    take: 80,
  });

  const byArticle = new Map<string, LegalCorpusResult & { tags: string[]; normalizedText: string }>();
  for (const row of indexRows) {
    const article = row.article;
    const tags = parseStoredTags(article.tags);
    const existing = byArticle.get(article.id);
    const baseScore = scoreLegalArticle(
      { tags, normalizedText: article.normalizedText },
      signals,
    ) + row.weight;

    if (!existing || baseScore > existing.score) {
      byArticle.set(article.id, {
        documentTitle: article.document.title,
        articleNumber: article.articleNumber,
        articleText: article.text,
        plainSummary: article.plainSummary,
        sourceUrl: article.sourceUrl || article.document.sourceUrl,
        score: baseScore,
        tags,
        normalizedText: article.normalizedText,
      });
    }
  }

  const results = [...byArticle.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!results.length) return null;
  const context = buildLegalCorpusContext(results);
  return {
    ...context,
    query: signals.normalizedQuery,
    latencyMs: Date.now() - started,
  };
}
