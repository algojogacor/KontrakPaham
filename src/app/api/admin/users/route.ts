import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { getEffectivePlan, getPlanLimits } from "@/lib/quota";

function monthYear(d = new Date()) {
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const { month, year } = monthYear();

  const [totalUsers, activeUsers, paidUsers, analysesAgg, users] =
    await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          OR: [
            { analyses: { some: {} } },
            { quotas: { some: { month, year, analysesUsed: { gt: 0 } } } },
          ],
        },
      }),
      db.user.count({
        where: {
          OR: [
            { plan: "ADMIN" },
            {
              plan: { in: ["LITE", "PRO"] },
              planExpiresAt: { gt: new Date() },
            },
          ],
        },
      }),
      db.quota.aggregate({
        where: { month, year },
        _sum: { analysesUsed: true },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          quotas: {
            where: { month, year },
            take: 1,
          },
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              title: true,
              overallRisk: true,
              riskScore: true,
              createdAt: true,
            },
          },
          _count: { select: { analyses: true } },
        },
      }),
    ]);

  const analysesThisMonth = analysesAgg._sum.analysesUsed ?? 0;

  return NextResponse.json({
    summary: {
      totalUsers,
      activeUsers,
      paidUsers,
      analysesThisMonth,
      month,
      year,
    },
    users: users.map((u) => {
      const effectivePlan = getEffectivePlan(u);
      const limits = getPlanLimits(effectivePlan);
      const quota = u.quotas[0];
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        storedPlan: u.plan,
        plan: effectivePlan,
        planExpiresAt: u.planExpiresAt?.toISOString() || null,
        createdAt: u.createdAt.toISOString(),
        totalAnalyses: u._count.analyses,
        quota: {
          used: quota?.analysesUsed ?? 0,
          limit: quota?.analysesLimit ?? limits.analysesPerMonth,
          remaining: Math.max(
            0,
            (quota?.analysesLimit ?? limits.analysesPerMonth) -
              (quota?.analysesUsed ?? 0),
          ),
          month,
          year,
        },
        lastAnalysis: u.analyses[0]
          ? {
              id: u.analyses[0].id,
              title: u.analyses[0].title,
              overallRisk: u.analyses[0].overallRisk,
              riskScore: u.analyses[0].riskScore,
              createdAt: u.analyses[0].createdAt.toISOString(),
            }
          : null,
      };
    }),
  });
}
