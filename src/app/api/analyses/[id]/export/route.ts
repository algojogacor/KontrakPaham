import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateAnalysisPdf } from "@/lib/pdf-export";
import { toAnalysisDto } from "@/lib/types";
import { logger } from "@/lib/logger";

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
  if (analysis.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Analisis belum selesai, tidak bisa diekspor." },
      { status: 409 }
    );
  }

  try {
    const dto = toAnalysisDto(analysis);
    const userLabel = user.displayName || user.username;
    const pdf = generateAnalysisPdf(
      { ...dto, createdAt: new Date(dto.createdAt) } as any,
      userLabel
    );
    const safeTitle = (analysis.title || "analisis-kontrak")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
    const filename = `KontrakPaham-${safeTitle}.pdf`;

    return new NextResponse(pdf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    logger("error", "pdf export failed", { error: (e as Error).message });
    return NextResponse.json(
      { error: "Gagal membuat PDF report." },
      { status: 500 }
    );
  }
}
