import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { changePasswordSchema, formatZodErrors } from "@/lib/validation";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }
  const ip = getClientIp(req);
  const rl = rateLimit(`changepw:${user.id}`, 8, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const full = await db.user.findUnique({ where: { id: user.id } });
  if (!full) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

  const ok = await verifyPassword(parsed.data.currentPassword, full.passwordHash);
  if (!ok) {
    await audit("change_password_failed", { userId: user.id, ip, level: "warn" });
    return NextResponse.json({ error: "Password lama salah." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  await audit("change_password", { userId: user.id, ip });
  return NextResponse.json({ message: "Password berhasil diubah." });
}
