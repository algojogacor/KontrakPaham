import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getQuota, getPlanLimits } from "@/lib/quota";
import { logger } from "@/lib/logger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  try {
    const quota = await getQuota(user.id, user.plan);
    const limits = getPlanLimits(user.plan);
    return NextResponse.json({ quota, limits, plan: user.plan });
  } catch (e) {
    logger("error", "quota fetch failed", { userId: user.id, error: (e as Error).message });
    return NextResponse.json({ error: "Gagal memuat kuota." }, { status: 500 });
  }
}
