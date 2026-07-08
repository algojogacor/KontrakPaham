import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createAnalysisChatReply, listAnalysisChatMessages } from "@/lib/analysis-chat";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;

  const history = await listAnalysisChatMessages({ db, analysisId: id, userId: user.id });
  if (!history) {
    return NextResponse.json({ error: "Analisis tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(history);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  const { id } = await params;

  const ip = getClientIp(req);
  const limit = rateLimit(`analysis-chat:${user.id}:${ip}`, 20, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak pertanyaan lanjutan. Tunggu beberapa menit lalu coba lagi." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const question = String(body?.question || "");
    const result = await createAnalysisChatReply({ db, analysisId: id, userId: user.id, question });
    return NextResponse.json(result);
  } catch (e) {
    const message = (e as Error).message;
    if (message === "QUESTION_TOO_SHORT") {
      return NextResponse.json({ error: "Pertanyaan terlalu pendek." }, { status: 400 });
    }
    if (message === "QUESTION_TOO_LONG") {
      return NextResponse.json({ error: "Pertanyaan maksimal 3.000 karakter." }, { status: 400 });
    }
    if (message === "ANALYSIS_NOT_FOUND") {
      return NextResponse.json({ error: "Analisis tidak ditemukan." }, { status: 404 });
    }

    logger("error", "analysis chat failed", { userId: user.id, analysisId: id, error: message });
    return NextResponse.json({ error: "Gagal menjawab pertanyaan lanjutan. Silakan coba lagi." }, { status: 500 });
  }
}
