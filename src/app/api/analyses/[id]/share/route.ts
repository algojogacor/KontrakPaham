import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * POST /api/analyses/[id]/share
 * Generate a shareable read-only token for an analysis.
 * Returns existing token if already generated.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  try {
    const analysis = await db.analysis.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, shareToken: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analisis tidak ditemukan." }, { status: 404 });
    }
    if (analysis.userId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    if (analysis.status !== "COMPLETED") {
      return NextResponse.json({ error: "Analisis belum selesai, tidak bisa dibagikan." }, { status: 400 });
    }

    // Return existing token if already generated
    if (analysis.shareToken) {
      return NextResponse.json({ shareToken: analysis.shareToken });
    }

    // Generate new unique share token
    const shareToken = crypto.randomBytes(20).toString("base64url");

    await db.analysis.update({
      where: { id },
      data: { shareToken },
    });

    return NextResponse.json({ shareToken });
  } catch (e) {
    return NextResponse.json({ error: "Gagal membuat tautan berbagi." }, { status: 500 });
  }
}

/**
 * DELETE /api/analyses/[id]/share
 * Revoke the share token (makes the share link invalid).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }

  try {
    const analysis = await db.analysis.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analisis tidak ditemukan." }, { status: 404 });
    }
    if (analysis.userId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    await db.analysis.update({
      where: { id },
      data: { shareToken: null },
    });

    return NextResponse.json({ ok: true, message: "Tautan berbagi dicabut." });
  } catch (e) {
    return NextResponse.json({ error: "Gagal mencabut tautan berbagi." }, { status: 500 });
  }
}
