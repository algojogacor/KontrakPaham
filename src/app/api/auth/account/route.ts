import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, clearSessionCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/logger";

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }
  const ip = getClientIp(req);
  const rl = rateLimit(`delacct:${user.id}`, 3, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 }
    );
  }

  // Cascade delete removes analyses, findings, quota, resets, logs (per schema).
  await db.user.delete({ where: { id: user.id } });
  await audit("account_deleted", { ip, meta: { username: user.username } });
  await clearSessionCookie();
  return NextResponse.json({ message: "Akun dan seluruh data berhasil dihapus." });
}
