import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit, logger } from "@/lib/logger";
import { getPlanLimits, getQuota, consumeQuota, refundQuota } from "@/lib/quota";
import { contractTextSchema, sanitizeText } from "@/lib/validation";
import {
  parsePdf,
  parseDocx,
  validateContractText,
  DocumentError,
} from "@/lib/documents";
import { analyzeContract } from "@/lib/analyze";
import { toAnalysisDto } from "@/lib/types";

export const runtime = "nodejs";
// Analisis bisa lama; beri ruang lebih.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  }
  const ip = getClientIp(req);

  // Rate limit per user untuk analisis
  const rl = rateLimit(`analyze:${user.id}`, 10, 60 * 60 * 1000); // 10/jam
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Anda terlalu sering menganalisis. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const limits = getPlanLimits(user.plan);
  const quota = await getQuota(user.id, user.plan);
  if (quota.remaining <= 0) {
    return NextResponse.json(
      {
        error:
          "Kuota analisis bulan ini sudah habis. Kuota ter-reset setiap awal bulan, atau tingkatkan ke PRO.",
        quota,
      },
      { status: 402 }
    );
  }

  let contentType = req.headers.get("content-type") || "";
  let sourceType: "TEXT" | "PDF" | "DOCX" = "TEXT";
  let fileName: string | undefined;
  let rawText = "";
  let charCount = 0;
  const warnings: string[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const text = form.get("text");
      if (file && file instanceof File) {
        if (file.size > limits.maxFileBytes) {
          return NextResponse.json(
            {
              error: `Ukuran file melebihi batas ${Math.round(
                limits.maxFileBytes / 1024 / 1024
              )} MB untuk paket ${user.plan}.`,
            },
            { status: 413 }
          );
        }
        const ext = file.name.toLowerCase().split(".").pop() || "";
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        if (ext === "pdf" || file.type === "application/pdf") {
          sourceType = "PDF";
          fileName = file.name;
          const parsed = await parsePdf(data, file.name);
          rawText = parsed.text;
          warnings.push(...parsed.warnings);
        } else if (
          ext === "docx" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          sourceType = "DOCX";
          fileName = file.name;
          const parsed = await parseDocx(Buffer.from(arrayBuffer), file.name);
          rawText = parsed.text;
          warnings.push(...parsed.warnings);
        } else {
          return NextResponse.json(
            { error: "Format file tidak didukung. Hanya PDF atau DOCX." },
            { status: 415 }
          );
        }
      } else if (text && typeof text === "string") {
        sourceType = "TEXT";
        rawText = text;
      } else {
        return NextResponse.json(
          { error: "Kirim file (PDF/DOCX) atau teks kontrak." },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      if (typeof body?.text !== "string" || body.text.trim().length === 0) {
        return NextResponse.json(
          { error: "Isi teks kontrak tidak boleh kosong." },
          { status: 400 }
        );
      }
      sourceType = "TEXT";
      rawText = body.text;
    } else {
      return NextResponse.json(
        { error: "Content-Type tidak didukung." },
        { status: 415 }
      );
    }
  } catch (e) {
    if (e instanceof DocumentError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 422 });
    }
    logger("error", "document parse failed", { error: (e as Error).message });
    return NextResponse.json(
      { error: "Gagal memproses dokumen. File mungkin rusak atau format tidak didukung." },
      { status: 422 }
    );
  }

  // Validate text length & language
  const textCheck = contractTextSchema.safeParse(rawText);
  if (!textCheck.success) {
    return NextResponse.json(
      { error: textCheck.error.issues[0]?.message || "Teks kontrak tidak valid." },
      { status: 400 }
    );
  }
  rawText = textCheck.data;
  charCount = rawText.length;
  if (charCount > limits.maxChars) {
    return NextResponse.json(
      {
        error: `Teks terlalu panjang (${charCount.toLocaleString("id-ID")} karakter). Batas paket ${user.plan}: ${limits.maxChars.toLocaleString("id-ID")} karakter.`,
      },
      { status: 413 }
    );
  }
  const v = validateContractText(rawText, warnings);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 422 });
  }

  // Title heuristics
  const title = fileName
    ? fileName.replace(/\.(pdf|docx)$/i, "")
    : rawText.slice(0, 60).replace(/\s+/g, " ").trim() + (rawText.length > 60 ? "…" : "");

  // Create placeholder analysis record
  const analysis = await db.analysis.create({
    data: {
      userId: user.id,
      title: sanitizeText(title).slice(0, 200) || "Analisis Kontrak",
      sourceType,
      fileName: fileName ? sanitizeText(fileName).slice(0, 300) : null,
      charCount,
      status: "PENDING",
    },
  });

  // Consume quota up-front (refunded on failure)
  const consumed = await consumeQuota(user.id);
  if (!consumed) {
    await db.analysis.delete({ where: { id: analysis.id } }).catch(() => {});
    return NextResponse.json(
      { error: "Kuota analisis bulan ini sudah habis." },
      { status: 402 }
    );
  }

  try {
    const result = await analyzeContract(rawText);
    const updated = await db.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETED",
        summary: result.summary,
        overallRisk: result.overallRisk,
        riskScore: result.riskScore,
        modelUsed: result.modelUsed,
        findings: {
          create: result.findings.map((f) => ({
            category: f.category,
            categoryLabel: f.categoryLabel,
            severity: f.severity,
            confidence: f.confidence,
            urgency: f.urgency,
            originalClause: f.originalClause,
            plainTranslation: f.plainTranslation,
            explanation: f.explanation,
            recommendation: f.recommendation,
            actionType: f.actionType,
            location: f.location,
          })),
        },
      },
      include: { findings: true },
    });

    await audit("analysis_completed", {
      userId: user.id,
      ip,
      meta: {
        analysisId: analysis.id,
        findings: result.findings.length,
        risk: result.overallRisk,
        sourceType,
        ocr: warnings.some((w) => w.includes("OCR")),
      },
    });

    return NextResponse.json({
      analysis: toAnalysisDto({ ...updated, createdAt: new Date(updated.createdAt) }),
      warnings,
      notes: result.notes,
      uncertain: result.uncertain,
    });
  } catch (e) {
    logger("error", "analysis failed", {
      userId: user.id,
      analysisId: analysis.id,
      error: (e as Error).message,
    });
    await db.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "FAILED",
        errorMessage: "Analisis gagal. Silakan coba lagi.",
      },
    });
    await refundQuota(user.id);
    await audit("analysis_failed", {
      userId: user.id,
      ip,
      meta: { analysisId: analysis.id, error: (e as Error).message },
      level: "warn",
    });
    return NextResponse.json(
      { error: "Analisis gagal diproses. Kuota dikembalikan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
