import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { audit } from "@/lib/logger";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const { id } = await params;
  const revokeUser = req.nextUrl.searchParams.get("revokeUser") === "1";
  const license = await db.licenseCode.findUnique({
    where: { id },
    include: { redeemedBy: { select: { id: true, username: true, plan: true } } },
  });

  if (!license) {
    return NextResponse.json({ error: "License code tidak ditemukan." }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    if (revokeUser && license.redeemedById) {
      await tx.user.update({
        where: { id: license.redeemedById },
        data: { plan: "FREE", planExpiresAt: null },
      });
    }

    await tx.licenseCode.delete({ where: { id } });
  });

  await audit("license_deleted", {
    userId: admin.id,
    meta: {
      licenseId: id,
      codePrefix: license.codePrefix,
      plan: license.plan,
      revokedUserId: revokeUser ? license.redeemedById : null,
      revokedUsername: revokeUser ? license.redeemedBy?.username : null,
    },
  });

  return NextResponse.json({
    message: revokeUser && license.redeemedById ? "License dihapus dan akses user dicabut." : "License dihapus.",
  });
}
