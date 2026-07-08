import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEffectivePlan, getQuota, getPlanLimits } from "@/lib/quota";
import { logger } from "@/lib/logger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  try {
    const plan = getEffectivePlan(user);
    const quota = await getQuota(user.id, plan);
    const limits = getPlanLimits(plan);
    return NextResponse.json({ quota, limits, plan, planExpiresAt: user.planExpiresAt?.toISOString() || null });
  } catch (e) {
    logger("error", "quota fetch failed", { userId: user.id, error: (e as Error).message });
    return NextResponse.json({ error: "Gagal memuat kuota." }, { status: 500 });
  }
}
