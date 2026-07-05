import { db } from "@/lib/db";

export interface PlanLimits {
  analysesPerMonth: number;
  maxFileBytes: number;
  maxChars: number;
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    analysesPerMonth: 3,
    maxFileBytes: 5 * 1024 * 1024, // 5 MB
    maxChars: 50_000,
    features: [
      "3 analisis per bulan",
      "Upload PDF / DOCX / teks",
      "Deteksi klausul bermasalah",
      "Penjelasan bahasa awam",
      "Export PDF report",
    ],
  },
  PRO: {
    analysesPerMonth: 999, // praktis unlimited untuk demo
    maxFileBytes: 20 * 1024 * 1024, // 20 MB
    maxChars: 200_000,
    features: [
      "Analisis tak terbatas",
      "File hingga 20 MB",
      "Semua fitur FREE",
      "Prioritas antrean analisis",
      "Konsultasi lanjutan",
    ],
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

function monthYear(d = new Date()) {
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export async function getQuota(userId: string, plan: string) {
  const limits = getPlanLimits(plan);
  const { month, year } = monthYear();
  let quota = await db.quota.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });
  if (!quota) {
    quota = await db.quota.create({
      data: {
        userId,
        month,
        year,
        analysesUsed: 0,
        analysesLimit: limits.analysesPerMonth,
      },
    });
  }
  // Auto-upgrade limit if plan changed
  if (quota.analysesLimit !== limits.analysesPerMonth) {
    quota = await db.quota.update({
      where: { id: quota.id },
      data: { analysesLimit: limits.analysesPerMonth },
    });
  }
  return {
    used: quota.analysesUsed,
    limit: quota.analysesLimit,
    remaining: Math.max(0, quota.analysesLimit - quota.analysesUsed),
    month,
    year,
    plan,
  };
}

export async function consumeQuota(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  const quota = await getQuota(userId, user.plan);
  if (quota.remaining <= 0) return false;
  const { month, year } = monthYear();
  await db.quota.update({
    where: { userId_month_year: { userId, month, year } },
    data: { analysesUsed: { increment: 1 } },
  });
  return true;
}

export async function refundQuota(userId: string) {
  const { month, year } = monthYear();
  try {
    await db.quota.update({
      where: { userId_month_year: { userId, month, year } },
      data: { analysesUsed: { decrement: 1 } },
    });
  } catch {
    // ignore
  }
}
