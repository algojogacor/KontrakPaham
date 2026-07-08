import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { audit } from "@/lib/logger";
import { buildLicenseCode, hashLicenseCode, isPaidPlan } from "@/lib/license";
import { getPlanLimits } from "@/lib/quota";

const createSchema = z.object({
  plan: z.enum(["LITE", "PRO"]),
  durationMonths: z.coerce.number().int().min(1).max(12).default(1),
  maxUses: z.coerce.number().int().min(1).max(50).default(1),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
  note: z.string().max(240).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const licenses = await db.licenseCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        redeemedBy: { select: { username: true, email: true } },
        createdBy: { select: { username: true } },
      },
    });
    return NextResponse.json({
      licenses: licenses.map((l) => ({
        id: l.id,
        codePrefix: l.codePrefix,
        plan: l.plan,
        durationMonths: l.durationMonths,
        analysesLimit: l.analysesLimit,
        maxUses: l.maxUses,
        uses: l.uses,
        note: l.note,
        expiresAt: l.expiresAt?.toISOString() || null,
        redeemedAt: l.redeemedAt?.toISOString() || null,
        createdAt: l.createdAt.toISOString(),
        redeemedBy: l.redeemedBy,
        createdBy: l.createdBy,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input license tidak valid." }, { status: 400 });
  }

  const { plan, durationMonths, maxUses, expiresInDays, note } = parsed.data;
  if (!isPaidPlan(plan)) {
    return NextResponse.json({ error: "Plan tidak valid." }, { status: 400 });
  }
  const code = buildLicenseCode(plan);
  const codeHash = await hashLicenseCode(code);
  const limits = getPlanLimits(plan);
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

  const license = await db.licenseCode.create({
    data: {
      codeHash,
      codePrefix: code.slice(0, 12),
      plan,
      durationMonths,
      analysesLimit: limits.analysesPerMonth,
      maxUses,
      note: note?.trim() || null,
      expiresAt,
      createdById: admin.id,
    },
  });

  await audit("license_created", {
    userId: admin.id,
    meta: {
      codePrefix: license.codePrefix,
      plan,
      durationMonths,
      maxUses,
    },
  });

  return NextResponse.json({
    license: {
      id: license.id,
      code,
      codePrefix: license.codePrefix,
      plan,
      durationMonths,
      analysesLimit: license.analysesLimit,
      maxUses: license.maxUses,
      uses: license.uses,
      note: license.note,
      expiresAt: license.expiresAt?.toISOString() || null,
      createdAt: license.createdAt.toISOString(),
    },
  });
}
