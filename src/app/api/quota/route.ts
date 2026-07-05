import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getQuota } from "@/lib/quota";
import { getPlanLimits } from "@/lib/quota";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const quota = await getQuota(user.id, user.plan);
  const limits = getPlanLimits(user.plan);
  return NextResponse.json({ quota, limits, plan: user.plan });
}
