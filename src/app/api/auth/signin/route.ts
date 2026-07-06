import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signinSchema, formatZodErrors } from "@/lib/validation";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`signin:${ip}`, 10, 15 * 60 * 1000); // 10/15 menit
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = signinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  const idLower = identifier.toLowerCase();
  const user = await db.user.findFirst({
    where: { OR: [{ username: idLower }, { email: idLower }] },
  });

  // Timing-safe-ish: always run a hash compare even if user not found
  const dummyHash = "$2a$12$000000000000000000000000000000000000000000000000000000";
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, dummyHash);

  if (!user || !ok) {
    await audit("signin_failed", { ip, meta: { identifier: idLower }, level: "warn" });
    return NextResponse.json(
      { error: "Username/email atau password salah." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({ sub: user.id, username: user.username });
  await setSessionCookie(token);
  await audit("signin", { userId: user.id, ip });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      plan: user.plan,
      createdAt: user.createdAt.toISOString(),
    },
  });
}
