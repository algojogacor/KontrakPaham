import { createHash } from "crypto";
import { db } from "@/lib/db";
import { extractLegalIssueSignals, normalizeLegalSearchText } from "@/lib/legal-corpus";

export interface SeedLegalArticleInput {
  document: {
    title: string;
    type: string;
    number?: string;
    year?: number;
    sourceUrl?: string;
    sourceHost?: string;
  };
  articleNumber: string;
  title?: string;
  text: string;
  plainSummary?: string;
  tags: string[];
  sourceUrl?: string;
}

function hashArticle(input: SeedLegalArticleInput) {
  return createHash("sha256")
    .update(`${input.document.title}|${input.articleNumber}|${input.text}`, "utf8")
    .digest("hex");
}

function tokensForArticle(input: SeedLegalArticleInput) {
  const signals = extractLegalIssueSignals(`${input.text} ${input.plainSummary || ""} ${input.tags.join(" ")}`);
  return [...new Set([...signals.keywords, ...input.tags, ...signals.normalizedQuery.split(" ")])]
    .map(normalizeLegalSearchText)
    .filter((token) => token.length >= 3)
    .slice(0, 80);
}

export async function seedLegalArticles(items: SeedLegalArticleInput[]) {
  for (const item of items) {
    const document = await db.legalDocument.upsert({
      where: { id: createHash("sha256").update(item.document.title).digest("hex").slice(0, 24) },
      create: {
        id: createHash("sha256").update(item.document.title).digest("hex").slice(0, 24),
        title: item.document.title,
        type: item.document.type,
        number: item.document.number || null,
        year: item.document.year || null,
        sourceUrl: item.document.sourceUrl || null,
        sourceHost: item.document.sourceHost || null,
        updatedAt: new Date(),
      },
      update: {
        type: item.document.type,
        number: item.document.number || null,
        year: item.document.year || null,
        sourceUrl: item.document.sourceUrl || null,
        sourceHost: item.document.sourceHost || null,
        updatedAt: new Date(),
      },
    });

    const contentHash = hashArticle(item);
    const article = await db.legalArticle.upsert({
      where: { contentHash },
      create: {
        documentId: document.id,
        articleNumber: item.articleNumber,
        title: item.title || null,
        text: item.text,
        plainSummary: item.plainSummary || null,
        tags: JSON.stringify(item.tags),
        normalizedText: normalizeLegalSearchText(`${item.articleNumber} ${item.title || ""} ${item.text} ${item.plainSummary || ""} ${item.tags.join(" ")}`),
        sourceUrl: item.sourceUrl || item.document.sourceUrl || null,
        contentHash,
        updatedAt: new Date(),
      },
      update: {
        articleNumber: item.articleNumber,
        title: item.title || null,
        text: item.text,
        plainSummary: item.plainSummary || null,
        tags: JSON.stringify(item.tags),
        normalizedText: normalizeLegalSearchText(`${item.articleNumber} ${item.title || ""} ${item.text} ${item.plainSummary || ""} ${item.tags.join(" ")}`),
        sourceUrl: item.sourceUrl || item.document.sourceUrl || null,
        updatedAt: new Date(),
      },
    });

    for (const token of tokensForArticle(item)) {
      await db.legalArticleIndex.upsert({
        where: { articleId_token: { articleId: article.id, token } },
        create: {
          articleId: article.id,
          token,
          tag: item.tags.includes(token) ? token : null,
          weight: item.tags.includes(token) ? 5 : 1,
        },
        update: {
          tag: item.tags.includes(token) ? token : null,
          weight: item.tags.includes(token) ? 5 : 1,
        },
      });
    }
  }
}
