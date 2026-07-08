import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addLicenseMonths, hashLicenseCode, isPaidPlan, normalizeLicenseCode } from "@/lib/license";
import { getPlanLimits } from "@/lib/quota";
import { audit } from "@/lib/logger";

const redeemSchema = z.object({
  code: z.string().min(8).max(80),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Kode lisensi tidak valid." }, { status: 400 });
  }

  const normalized = normalizeLicenseCode(parsed.data.code);
  const codeHash = await hashLicenseCode(normalized);
  const license = await db.licenseCode.findUnique({ where: { codeHash } });
  if (!license) {
    return NextResponse.json({ error: "Kode lisensi tidak ditemukan." }, { status: 404 });
  }
  if (!isPaidPlan(license.plan)) {
    return NextResponse.json({ error: "Plan lisensi tidak valid." }, { status: 422 });
  }
  if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Kode lisensi sudah kedaluwarsa." }, { status: 410 });
  }
  if (license.uses >= license.maxUses) {
    return NextResponse.json({ error: "Kode lisensi sudah pernah digunakan." }, { status: 409 });
  }

  const now = new Date();
  const planExpiresAt = addLicenseMonths(now, license.durationMonths, user.planExpiresAt);
  const limits = getPlanLimits(license.plan);

  const [, updated] = await db.$transaction([
    db.licenseCode.update({
      where: { id: license.id },
      data: {
        uses: { increment: 1 },
        redeemedAt: now,
        redeemedById: user.id,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: {
        plan: license.plan,
        planExpiresAt,
      },
    }),
  ]);

  await audit("license_redeemed", {
    userId: user.id,
    meta: {
      codePrefix: license.codePrefix,
      plan: license.plan,
      durationMonths: license.durationMonths,
    },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      displayName: updated.displayName,
      plan: updated.plan,
      planExpiresAt: updated.planExpiresAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
    },
    license: {
      plan: license.plan,
      durationMonths: license.durationMonths,
      planExpiresAt: planExpiresAt.toISOString(),
      analysesLimit: limits.analysesPerMonth,
    },
  });
}
