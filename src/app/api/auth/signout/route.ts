import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { audit, logger } from "@/lib/logger";

export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    await clearSessionCookie();
    if (user) await audit("signout", { userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger("error", "signout failed", { error: (e as Error).message });
    // Still try to clear cookie even if audit fails
    await clearSessionCookie().catch(() => {});
    return NextResponse.json({ ok: true });
  }
}
