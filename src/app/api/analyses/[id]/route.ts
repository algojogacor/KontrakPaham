import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toAnalysisDto } from "@/lib/types";
import { audit, logger } from "@/lib/logger";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;

  const analysis = await db.analysis.findFirst({
    where: { id, userId: user.id },
    include: { findings: { orderBy: { severity: "asc" } } },
  });
  if (!analysis) {
    return NextResponse.json({ error: "Analisis tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ analysis: toAnalysisDto(analysis) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;
  const ip = getClientIp(req);

  const analysis = await db.analysis.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!analysis) {
    return NextResponse.json({ error: "Analisis tidak ditemukan." }, { status: 404 });
  }

  try {
    await db.analysis.delete({ where: { id } });
    await audit("analysis_deleted", { userId: user.id, ip, meta: { analysisId: id } });
    return NextResponse.json({ message: "Analisis berhasil dihapus." });
  } catch (e) {
    logger("error", "delete analysis failed", { error: (e as Error).message });
    return NextResponse.json({ error: "Gagal menghapus analisis." }, { status: 500 });
  }
}
