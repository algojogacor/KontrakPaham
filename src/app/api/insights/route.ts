import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const analyses = await db.analysis.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    select: {
      id: true,
      title: true,
      sourceType: true,
      charCount: true,
      overallRisk: true,
      riskScore: true,
      createdAt: true,
      findings: {
        select: {
          category: true,
          categoryLabel: true,
          severity: true,
          actionType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (analyses.length === 0) {
    return NextResponse.json({
      total: 0,
      avgRiskScore: 0,
      riskDistribution: {},
      categoryFrequency: [],
      sourceTypeDistribution: {},
      recentTrend: [],
      topRiskyCategories: [],
      needsActionCount: 0,
    });
  }

  const total = analyses.length;
  const avgRiskScore = Math.round(
    analyses.reduce((s, a) => s + (a.riskScore || 0), 0) / total
  );

  const riskDistribution: Record<string, number> = {};
  const sourceTypeDistribution: Record<string, number> = {};
  const categoryCount: Record<string, { count: number; label: string }> = {};
  let needsActionCount = 0;

  for (const a of analyses) {
    riskDistribution[a.overallRisk || "SEDANG"] = (riskDistribution[a.overallRisk || "SEDANG"] || 0) + 1;
    sourceTypeDistribution[a.sourceType] = (sourceTypeDistribution[a.sourceType] || 0) + 1;
    for (const f of a.findings) {
      if (!categoryCount[f.category]) {
        categoryCount[f.category] = { count: 0, label: f.categoryLabel };
      }
      categoryCount[f.category].count += 1;
      if (f.actionType === "BUTUH_NASIHAT") needsActionCount += 1;
    }
  }

  const topRiskyCategories = Object.entries(categoryCount)
    .map(([category, { count, label }]) => ({ category, label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const recentTrend = [...analyses]
    .reverse()
    .slice(-8)
    .map((a) => ({
      id: a.id,
      title: a.title.slice(0, 30),
      riskScore: a.riskScore || 0,
      overallRisk: a.overallRisk,
      createdAt: a.createdAt.toISOString(),
    }));

  return NextResponse.json({
    total,
    avgRiskScore,
    riskDistribution,
    categoryFrequency: topRiskyCategories,
    sourceTypeDistribution,
    recentTrend,
    topRiskyCategories,
    needsActionCount,
  });
}
