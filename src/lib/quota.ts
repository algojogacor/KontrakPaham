import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";

export { getPlanLimits, PLAN_LIMITS, type PlanLimits } from "@/lib/plans";

export function getEffectivePlan(user: { plan: string; planExpiresAt?: Date | string | null }): string {
  if (user.plan === "ADMIN") return "ADMIN";
  if (user.plan === "FREE") return "FREE";
  if (!user.planExpiresAt) return "FREE";
  const expires = user.planExpiresAt instanceof Date ? user.planExpiresAt : new Date(user.planExpiresAt);
  return expires.getTime() > Date.now() ? user.plan : "FREE";
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

export async function consumeQuota(userId: string, plan: string): Promise<boolean> {
  const quota = await getQuota(userId, plan);
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
