import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAnalysisDto } from "@/lib/types";

export const runtime = "nodejs";

/**
 * GET /api/share/[token]
 * Public endpoint — no auth required.
 * Returns read-only analysis data for the given share token.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
  }

  try {
    const analysis = await db.analysis.findUnique({
      where: { shareToken: token },
      include: {
        findings: true,
        user: { select: { username: true, displayName: true } },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Tautan tidak valid atau sudah dicabut oleh pemiliknya." },
        { status: 404 }
      );
    }

    if (analysis.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Analisis ini belum selesai atau gagal diproses." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysis: toAnalysisDto({ ...analysis, createdAt: new Date(analysis.createdAt) }),
      sharedBy: analysis.user?.displayName || analysis.user?.username || "Pengguna",
    });
  } catch (e) {
    return NextResponse.json({ error: "Gagal memuat analisis." }, { status: 500 });
  }
}
