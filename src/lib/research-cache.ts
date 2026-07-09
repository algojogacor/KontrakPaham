import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { LegalResearchContext, ResearchEffort, ResearchSource } from "@/lib/research";

export const RESEARCH_CACHE_VERSION =
  process.env.RESEARCH_CACHE_VERSION || "legal-reference-v1";
export const RESEARCH_CACHE_TTL_MS = Number(
  process.env.RESEARCH_CACHE_TTL_MS || 14 * 24 * 60 * 60 * 1000,
);

export function normalizeResearchQuery(query: string) {
  return query.replace(/\s+/g, " ").trim().toLowerCase();
}

export function buildResearchCacheKey(params: {
  query: string;
  effort: ResearchEffort;
}) {
  const hash = createHash("sha256")
    .update(normalizeResearchQuery(params.query), "utf8")
    .digest("hex");
  return `${RESEARCH_CACHE_VERSION}|effort:${params.effort}|sha256:${hash}`;
}

export function isResearchCacheFresh(params: {
  cachedAt: Date;
  now?: Date;
  ttlMs?: number;
}) {
  const now = params.now || new Date();
  const ttlMs = params.ttlMs ?? RESEARCH_CACHE_TTL_MS;
  return now.getTime() - params.cachedAt.getTime() <= ttlMs;
}

function parseSources(value: string | null): ResearchSource[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((source: any) => ({
        title: String(source?.title || "Sumber resmi").slice(0, 180),
        url: String(source?.url || ""),
      }))
      .filter((source) => source.url)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function getCachedLegalResearch(params: {
  query: string;
  effort: ResearchEffort;
}): Promise<LegalResearchContext | null> {
  const cacheKey = buildResearchCacheKey(params);
  const row = await db.legalReferenceCache.findUnique({
    where: { cacheKey },
  });

  if (!row || !isResearchCacheFresh({ cachedAt: row.updatedAt })) {
    return null;
  }

  await db.legalReferenceCache
    .update({
      where: { cacheKey },
      data: {
        hitCount: { increment: 1 },
        lastHitAt: new Date(),
      },
    })
    .catch(() => {});

  return {
    enabled: true,
    effort: row.effort as ResearchEffort,
    query: row.query,
    content: row.content,
    sources: parseSources(row.sources),
    latencyMs: 0,
    warning: "Riset hukum diambil dari cache legal reference.",
  };
}

export async function saveLegalResearchCache(params: {
  query: string;
  effort: ResearchEffort;
  content: string;
  sources: ResearchSource[];
  latencyMs: number;
}) {
  const normalizedQuery = normalizeResearchQuery(params.query);
  const cacheKey = buildResearchCacheKey(params);
  await db.legalReferenceCache.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      normalizedQuery,
      query: params.query,
      effort: params.effort,
      content: params.content,
      sources: JSON.stringify(params.sources || []),
      latencyMs: params.latencyMs,
    },
    update: {
      normalizedQuery,
      query: params.query,
      effort: params.effort,
      content: params.content,
      sources: JSON.stringify(params.sources || []),
      latencyMs: params.latencyMs,
    },
  });
}
