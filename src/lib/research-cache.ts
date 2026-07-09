import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { LegalResearchContext, ResearchEffort, ResearchSource } from "@/lib/research";

export const RESEARCH_CACHE_VERSION =
  process.env.RESEARCH_CACHE_VERSION || "legal-reference-v1";
export const RESEARCH_CACHE_TTL_MS = Number(
  process.env.RESEARCH_CACHE_TTL_MS || 14 * 24 * 60 * 60 * 1000,
);
// Turso Free is currently 5GB storage, so keep the cache below that by default.
// Set LEGAL_REFERENCE_CACHE_MAX_BYTES=10000000000 only if your database plan allows it.
export const LEGAL_REFERENCE_CACHE_MAX_BYTES = Number(
  process.env.LEGAL_REFERENCE_CACHE_MAX_BYTES || 4_000_000_000,
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

export function estimateResearchCacheBytes(params: {
  query: string;
  content: string;
  sources: ResearchSource[];
}) {
  return Buffer.byteLength(params.query, "utf8") +
    Buffer.byteLength(params.content, "utf8") +
    Buffer.byteLength(JSON.stringify(params.sources || []), "utf8");
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
  const contentBytes = estimateResearchCacheBytes(params);
  await db.legalReferenceCache.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      normalizedQuery,
      query: params.query,
      effort: params.effort,
      content: params.content,
      contentBytes,
      sources: JSON.stringify(params.sources || []),
      latencyMs: params.latencyMs,
    },
    update: {
      normalizedQuery,
      query: params.query,
      effort: params.effort,
      content: params.content,
      contentBytes,
      sources: JSON.stringify(params.sources || []),
      latencyMs: params.latencyMs,
    },
  });
  await enforceLegalReferenceCacheLimit();
}

export async function enforceLegalReferenceCacheLimit(
  maxBytes = LEGAL_REFERENCE_CACHE_MAX_BYTES,
) {
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) return;

  const aggregate = await db.legalReferenceCache.aggregate({
    _sum: { contentBytes: true },
  });
  let totalBytes = aggregate._sum.contentBytes || 0;
  if (totalBytes <= maxBytes) return;

  const rows = await db.legalReferenceCache.findMany({
    orderBy: [
      { lastHitAt: "asc" },
      { updatedAt: "asc" },
    ],
    select: { id: true, contentBytes: true },
  });

  for (const row of rows) {
    if (totalBytes <= maxBytes) break;
    await db.legalReferenceCache.delete({ where: { id: row.id } });
    totalBytes -= row.contentBytes || 0;
  }
}
