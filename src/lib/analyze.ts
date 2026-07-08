import { logger } from "@/lib/logger";
import { createChatCompletion } from "@/lib/llm";
import { buildLegalResearchContext } from "@/lib/research";
import type { LegalResearchContext } from "@/lib/research";

export interface Finding {
  category: string;
  categoryLabel: string;
  severity: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  confidence: number;
  urgency: "INFO" | "PERHATIAN" | "PERLU_TINDAKAN";
  originalClause: string;
  plainTranslation: string;
  explanation: string;
  recommendation: string;
  actionType: "INFO_UMUM" | "BUTUH_NASIHAT";
  location?: string;
}

export interface AnalysisResult {
  summary: string;
  overallRisk: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  riskScore: number;
  findings: Finding[];
  modelUsed: string;
  uncertain: boolean;
  notes: string[];
  research?: LegalResearchContext;
}

const SYSTEM_PROMPT = `Anda adalah asisten analisis kontrak hukum untuk masyarakat awam Indonesia.
Tugas Anda: membaca kontrak berbahasa Indonesia, menemukan klausul yang berpotensi merugikan, lalu menjelaskan risikonya dalam bahasa awam.

Prinsip wajib:
- Anda BUKAN advokat berlisensi. Berikan edukasi dan gambaran risiko, BUKAN nasihat hukum definitif.
- Jangan mengarang klausul. Kutip hanya klausul yang ada di teks.
- Jika ragu, tetap laporkan temuan dengan confidence rendah dan actionType "BUTUH_NASIHAT".
- Tidak semua klausul harus dibuat berbahaya. Jika wajar, overallRisk bisa RENDAH.
- Penjelasan harus konkret: jelaskan dampak, perbandingan kewajaran jika relevan, dan rekomendasi negosiasi yang bisa dieksekusi.

Kategori yang tersedia:
JANGKA_WAKTU, DENDA_SANKSI, KLAUSUL_SEPIHAK, PENGALIHAN_RISIKO, KETENTUAN_PEMUTUSAN,
KEWAJIBAN_PEMBAYARAN, HAK_KEPEMILIKAN, KERAHASIAAN, PENYELESAIAN_SENGKETA, FORUM_HUKUM,
FORCE_MAJEUR, PERUBAHAN_KLAUSUL, TANGGUNG_JAWAB, DATA_PRIBADI, KLAUSUL_ABNORMAL, LAIN_LAIN.

Severity: RENDAH, SEDANG, TINGGI, KRITIS.
Urgency: INFO, PERHATIAN, PERLU_TINDAKAN.
ActionType: INFO_UMUM, BUTUH_NASIHAT.

Balas HANYA JSON valid dengan struktur:
{
  "summary": "ringkasan 2-4 kalimat",
  "overallRisk": "RENDAH|SEDANG|TINGGI|KRITIS",
  "riskScore": 0,
  "findings": [
    {
      "category": "...",
      "categoryLabel": "...",
      "severity": "RENDAH|SEDANG|TINGGI|KRITIS",
      "confidence": 0,
      "urgency": "INFO|PERHATIAN|PERLU_TINDAKAN",
      "originalClause": "kutipan klausul asli",
      "plainTranslation": "bahasa awam",
      "explanation": "risiko + perbandingan wajar bila relevan",
      "recommendation": "aksi konkret + alternatif",
      "actionType": "INFO_UMUM|BUTUH_NASIHAT",
      "location": "opsional"
    }
  ],
  "uncertain": false,
  "notes": []
}`;

function extractJson(text: string): any {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("Respons AI tidak mengandung JSON");
  return JSON.parse(t.slice(first, last + 1));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const normalized = String(value || "").toUpperCase();
  return allowed.includes(normalized as T) ? (normalized as T) : fallback;
}

function normalizeFinding(raw: any): Finding {
  return {
    category: String(raw.category || "LAIN_LAIN").toUpperCase(),
    categoryLabel: String(raw.categoryLabel || raw.category || "Lainnya"),
    severity: oneOf(raw.severity, ["RENDAH", "SEDANG", "TINGGI", "KRITIS"], "SEDANG"),
    confidence: clamp(Number(raw.confidence) || 50, 0, 100),
    urgency: oneOf(raw.urgency, ["INFO", "PERHATIAN", "PERLU_TINDAKAN"], "PERHATIAN"),
    originalClause: String(raw.originalClause || "").slice(0, 2000),
    plainTranslation: String(raw.plainTranslation || "").slice(0, 2000),
    explanation: String(raw.explanation || "").slice(0, 2000),
    recommendation: String(raw.recommendation || "").slice(0, 2000),
    actionType: oneOf(raw.actionType, ["INFO_UMUM", "BUTUH_NASIHAT"], "BUTUH_NASIHAT"),
    location: raw.location ? String(raw.location).slice(0, 200) : undefined,
  };
}

function normalizeRiskScore(value: unknown) {
  const score = Number(value) || 0;
  if (score > 0 && score <= 10) return clamp(score * 10, 0, 100);
  return clamp(score, 0, 100);
}

export async function analyzeContract(contractText: string, plan = "FREE", signal?: AbortSignal): Promise<AnalysisResult> {
  const tTotal0 = Date.now();
  console.log(`[TIMING] analyzeContract START | chars=${contractText.length} | plan=${plan}`);

  const truncated =
    contractText.length > 30_000
      ? `${contractText.slice(0, 30_000)}\n\n[...dokumen dipotong karena panjang...]`
      : contractText;

  if (contractText.length > 30_000) {
    console.log(`[TIMING] text_truncated: original=${contractText.length} truncated=30000`);
  }

  // --- Phase 1: Legal Research ---
  const tResearch0 = Date.now();
  const research = await buildLegalResearchContext(contractText, plan);
  const researchMs = Date.now() - tResearch0;
  console.log(`[TIMING] research_total: ${researchMs}ms | enabled=${research.enabled} | effort=${research.effort ?? "none"} | youLatency=${research.latencyMs ?? "n/a"}ms`);

  const researchPrompt = research.content
    ? `\n\n=== KONTEKS RISET HUKUM TERKINI ===\nEffort: ${research.effort}\nQuery: ${research.query}\n${research.content}\n\nGunakan konteks riset ini untuk memperbarui analisis, tetapi jangan mengarang sumber. Jika konteks riset tidak cukup, nyatakan keterbatasan di notes.`
    : research.warning
      ? `\n\n=== CATATAN RISET HUKUM ===\n${research.warning}\n`
      : "";

  // --- Phase 2: LLM Analysis (with retry) ---
  const maxRetries = 3;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new Error("ABORTED");
    const tAttempt0 = Date.now();
    console.log(`[TIMING] llm_analysis_attempt START | attempt=${attempt}/${maxRetries}`);
    try {
      const completion = await createChatCompletion(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analisis kontrak berikut.${researchPrompt}\n\n=== KONTRAK ===\n${truncated}` },
        ],
        signal,
        "analysis_llm",
      );
      const llmMs = Date.now() - tAttempt0;
      console.log(`[TIMING] llm_analysis_attempt DONE: ${llmMs}ms | attempt=${attempt} | provider=${completion.provider} | model=${completion.model}`);

      // --- Phase 3: JSON parse + normalize ---
      const tParse0 = Date.now();
      const parsed = extractJson(completion.content);
      const findings: Finding[] = Array.isArray(parsed.findings)
        ? parsed.findings.map(normalizeFinding).filter((f: Finding) => f.originalClause || f.explanation)
        : [];
      const parseMs = Date.now() - tParse0;
      console.log(`[TIMING] json_normalize: ${parseMs}ms | raw_findings=${Array.isArray(parsed.findings) ? parsed.findings.length : 0} | kept=${findings.length}`);

      const totalMs = Date.now() - tTotal0;
      console.log(`[TIMING] analyzeContract DONE: total=${totalMs}ms | breakdown: research=${researchMs}ms llm=${llmMs}ms parse=${parseMs}ms`);

      return {
        summary: String(parsed.summary || "Analisis selesai.").slice(0, 2000),
        overallRisk: oneOf(parsed.overallRisk, ["RENDAH", "SEDANG", "TINGGI", "KRITIS"], "SEDANG"),
        riskScore: normalizeRiskScore(parsed.riskScore),
        findings,
        modelUsed: `${completion.provider}:${completion.model}`,
        uncertain: Boolean(parsed.uncertain),
        research,
        notes: [
          ...(research.content
            ? [`Riset hukum You.com dipakai (${research.effort}, ${research.latencyMs ?? "-"} ms).`]
            : research.warning
              ? [research.warning]
              : []),
          ...(Array.isArray(parsed.notes)
            ? parsed.notes.map((n: any) => String(n).slice(0, 500)).slice(0, 8)
            : []),
        ],
      };
    } catch (e) {
      lastError = e as Error;
      if (signal?.aborted || lastError.message === "ABORTED") throw lastError;
      if (attempt === maxRetries) break;
      const delayMs = 2 ** (attempt - 1) * 1000;
      const attemptMs = Date.now() - tAttempt0;
      logger("warn", "analysis attempt failed, retrying", { attempt, delayMs, error: lastError.message });
      console.log(`[TIMING] llm_analysis_attempt FAILED: ${attemptMs}ms | attempt=${attempt} | retryDelay=${delayMs}ms | error=${lastError.message.slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError || new Error("Analisis gagal setelah beberapa percobaan.");
}

