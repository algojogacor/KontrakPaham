import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signupSchema, formatZodErrors } from "@/lib/validation";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000); // 5/jam per IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan registrasi. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodErrors(parsed.error) },
      { status: 400 }
    );
  }
  const { username, email, password, displayName } = parsed.data;

  const exists = await db.user.findFirst({
    where: { OR: [{ username: username.toLowerCase() }, { email }] },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Username atau email sudah terdaftar." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      username: username.toLowerCase(),
      email,
      passwordHash,
      displayName: displayName || username,
      plan: "FREE",
    },
  });

  const token = await createSessionToken({ sub: user.id, username: user.username });
  await setSessionCookie(token);
  await audit("signup", { userId: user.id, ip, meta: { username: user.username } });

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
