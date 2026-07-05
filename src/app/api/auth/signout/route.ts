import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/logger";

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser();
  await clearSessionCookie();
  if (user) await audit("signout", { userId: user.id });
  return NextResponse.json({ ok: true });
}
