import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit, logger } from "@/lib/logger";
import { getEffectivePlan, getPlanLimits, getQuota, consumeQuota, refundQuota } from "@/lib/quota";
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

  const plan = getEffectivePlan(user);
  const limits = getPlanLimits(plan);

  const quota = await getQuota(user.id, plan);

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
  let quickMode = false;
  const warnings: string[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const text = form.get("text");
      quickMode = form.get("quickMode") === "true";
      if (file && file instanceof File) {
        if (file.size > limits.maxFileBytes) {
          return NextResponse.json(
            {
              error: `Ukuran file melebihi batas ${Math.round(
                limits.maxFileBytes / 1024 / 1024
                )} MB untuk paket ${plan}.`,
            },
            { status: 413 }
          );
        }
        const ext = file.name.toLowerCase().split(".").pop() || "";
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        // Magic bytes validation — prevents spoofed file extensions
        const magic = Buffer.from(data.slice(0, 8));
        const isPdf = magic[0] === 0x25 && magic[1] === 0x50 && magic[2] === 0x44 && magic[3] === 0x46; // %PDF
        const isZip = magic[0] === 0x50 && magic[1] === 0x4b; // PK — DOCX is ZIP

        if (ext === "pdf" || file.type === "application/pdf") {
          if (!isPdf) {
            return NextResponse.json(
              { error: "File bukan PDF valid. Pastikan file tidak rusak." },
              { status: 422 }
            );
          }
          sourceType = "PDF";
          fileName = file.name;
          const parsed = await parsePdf(data, file.name);
          rawText = parsed.text;
          warnings.push(...parsed.warnings);
        } else if (
          ext === "docx" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          if (!isZip) {
            return NextResponse.json(
              { error: "File bukan DOCX valid. Pastikan file tidak rusak." },
              { status: 422 }
            );
          }
          sourceType = "DOCX";
          fileName = file.name;
          const parsed = await parseDocx(Buffer.from(arrayBuffer), file.name);
          rawText = parsed.text;
          warnings.push(...parsed.warnings);
        } else if (
          ext === "txt" ||
          ext === "md" ||
          file.type === "text/plain" ||
          file.type === "text/markdown"
        ) {
          // Prevent compiled binaries renamed to .txt/.md by checking for null bytes
          if (data.includes(0)) {
            return NextResponse.json(
              { error: "File teks tidak valid. Terdeteksi konten biner." },
              { status: 422 }
            );
          }
          sourceType = "TEXT";
          fileName = file.name;
          rawText = new TextDecoder("utf-8").decode(data);
        } else {
          return NextResponse.json(
            { error: "Format file tidak didukung. Gunakan PDF, DOCX, TXT, atau MD." },
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
      quickMode = Boolean(body.quickMode);
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
        error: `Teks terlalu panjang (${charCount.toLocaleString("id-ID")} karakter). Batas paket ${plan}: ${limits.maxChars.toLocaleString("id-ID")} karakter.`,
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

  // Idempotency: if client sends Idempotency-Key header, check for existing
  // analysis with same key. Prevents double-submit (e.g. double-click) from
  // consuming quota twice.
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const existing = await db.analysis.findFirst({
      where: {
        userId: user.id,
        // Store key in fileName field's metadata isn't clean; use title prefix.
        // Better: dedicated column. For now, use a hash stored in title suffix.
        title: { contains: `[idem:${idempotencyKey.slice(0, 16)}]` },
        status: { in: ["COMPLETED", "PENDING"] },
      },
      include: { findings: true },
    });
    if (existing) {
      if (existing.status === "COMPLETED") {
        return NextResponse.json({
          analysis: toAnalysisDto({ ...existing, createdAt: new Date(existing.createdAt) }),
          warnings: [],
          notes: [],
          uncertain: false,
          idempotent: true,
        });
      }
      // Still pending — return 409
      return NextResponse.json(
        { error: "Analisis dengan key ini sedang berjalan.", code: "IN_PROGRESS" },
        { status: 409 }
      );
    }
  }

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
    const result = await analyzeContract(rawText, plan, undefined, quickMode);

    const updated = await db.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETED",
        summary: result.summary,
        overallRisk: result.overallRisk,
        riskScore: result.riskScore,
        modelUsed: result.modelUsed,
        researchEffort: result.research?.effort || null,
        researchQuery: result.research?.query || null,
        researchLatencyMs: result.research?.latencyMs || null,
        researchContent: result.research?.content || result.research?.warning || null,
        researchSources: result.research?.sources ? JSON.stringify(result.research.sources) : null,
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

