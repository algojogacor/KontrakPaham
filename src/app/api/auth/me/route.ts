import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getQuota } from "@/lib/quota";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, quota: null });
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
}
