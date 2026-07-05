import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getQuota } from "@/lib/quota";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const analyses = await db.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      sourceType: true,
      fileName: true,
      charCount: true,
      summary: true,
      overallRisk: true,
      riskScore: true,
      status: true,
      createdAt: true,
      _count: { select: { findings: true } },
    },
    take: 100,
  });

  const quota = await getQuota(user.id, user.plan);

  return NextResponse.json({
    analyses: analyses.map((a) => ({
      id: a.id,
      title: a.title,
      sourceType: a.sourceType,
      fileName: a.fileName,
      charCount: a.charCount,
      summary: a.summary,
      overallRisk: a.overallRisk,
      riskScore: a.riskScore,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      findingsCount: a._count.findings,
    })),
    quota,
  });
}
