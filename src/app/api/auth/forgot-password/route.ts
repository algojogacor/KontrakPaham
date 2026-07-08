import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema, formatZodErrors } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/logger";
import { randomBytes } from "crypto";

// In this single-instance demo there's no email server. We generate a reset
// token and return it (only when the email exists) so the user can reset.
// In production you would email a link instead.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan reset. Coba lagi nanti." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Always respond the same to avoid user enumeration
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 menit
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    await db.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });
    await audit("password_reset_requested", { userId: user.id, ip });
    // SECURITY FIX: Never leak reset token in HTTP response. Log it instead for demo purposes.
    console.log(`[DEMO] Reset token for ${user.email}: ${token}`);

    return NextResponse.json({
      message:
        "Jika email terdaftar, tautan reset telah dibuat. (Mode demo) Periksa log server untuk token reset.",
    });
  }

  await audit("password_reset_requested_unknown", { ip, meta: { email: parsed.data.email }, level: "warn" });
  return NextResponse.json({
    message:
      "Jika email terdaftar, tautan reset telah dibuat. (Mode demo) Periksa log server untuk token reset.",
  });
}
