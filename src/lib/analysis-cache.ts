import { createHash } from "crypto";
import { db } from "@/lib/db";

export const ANALYSIS_CACHE_VERSION =
  process.env.ANALYSIS_CACHE_VERSION || "analysis-v1-research-v1";

export function normalizeAnalysisTextForHash(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function hashAnalysisText(text: string) {
  return createHash("sha256")
    .update(normalizeAnalysisTextForHash(text), "utf8")
    .digest("hex");
}

export function buildAnalysisCacheKey(params: {
  textHash: string;
  plan: string;
  quickMode: boolean;
}) {
  return [
    ANALYSIS_CACHE_VERSION,
    `plan:${params.plan}`,
    `quick:${params.quickMode ? "1" : "0"}`,
    `sha256:${params.textHash}`,
  ].join("|");
}

export async function findCompletedAnalysisCache(params: {
  userId: string;
  cacheKey: string;
}) {
  return db.analysis.findFirst({
    where: {
      userId: params.userId,
      cacheKey: params.cacheKey,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    include: { findings: true },
  });
}

export async function cloneAnalysisFromCache(params: {
  userId: string;
  sourceAnalysisId: string;
  title: string;
  sourceType: "TEXT" | "PDF" | "DOCX";
  fileName?: string | null;
  charCount: number;
  textHash: string;
  cacheKey: string;
}) {
  const source = await db.analysis.findFirst({
    where: {
      id: params.sourceAnalysisId,
      userId: params.userId,
      status: "COMPLETED",
    },
    include: { findings: true },
  });

  if (!source) return null;

  return db.analysis.create({
    data: {
      userId: params.userId,
      title: params.title,
      sourceType: params.sourceType,
      fileName: params.fileName,
      charCount: params.charCount,
      status: "COMPLETED",
      summary: source.summary,
      overallRisk: source.overallRisk,
      riskScore: source.riskScore,
      modelUsed: source.modelUsed,
      researchEffort: source.researchEffort,
      researchQuery: source.researchQuery,
      researchLatencyMs: source.researchLatencyMs,
      researchContent: source.researchContent,
      researchSources: source.researchSources,
      textHash: params.textHash,
      cacheKey: params.cacheKey,
      cacheHit: true,
      cacheSourceId: source.id,
      analysisVersion: source.analysisVersion || ANALYSIS_CACHE_VERSION,
      findings: {
        create: source.findings.map((finding) => ({
          category: finding.category,
          categoryLabel: finding.categoryLabel,
          severity: finding.severity,
          confidence: finding.confidence,
          urgency: finding.urgency,
          originalClause: finding.originalClause,
          plainTranslation: finding.plainTranslation,
          explanation: finding.explanation,
          recommendation: finding.recommendation,
          actionType: finding.actionType,
          location: finding.location,
        })),
      },
    },
    include: { findings: true },
  });
}
