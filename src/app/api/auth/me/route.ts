import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getQuota } from "@/lib/quota";
import { logger } from "@/lib/logger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, quota: null });
  try {
    const quota = await getQuota(user.id, user.plan);
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        plan: user.plan,
        createdAt: user.createdAt.toISOString(),
      },
      quota,
    });
  } catch (e) {
    logger("error", "me fetch failed", { userId: user.id, error: (e as Error).message });
    return NextResponse.json({ error: "Gagal memuat data akun." }, { status: 500 });
  }
}
