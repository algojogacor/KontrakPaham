import ZAI from "z-ai-web-dev-sdk";
import { logger } from "@/lib/logger";

export interface Finding {
  category: string;
  categoryLabel: string;
  severity: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  confidence: number; // 0-100
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
  riskScore: number; // 0-100
  findings: Finding[];
  modelUsed: string;
  uncertain: boolean;
  notes: string[];
}

const SYSTEM_PROMPT = `Anda adalah asisten analisis kontrak hukum untuk masyarakat awam Indonesia.
Tugas: menganalisis teks kontrak berbahasa Indonesia, mendeteksi klausul yang berpotensi bermasalah
atau merugikan salah satu pihak, lalu menjelaskannya dalam bahasa awam yang mudah dimengerti
orang yang bukan ahli hukum.

PRINSIP PENTING:
- Anda BUKAN advokat berlisensi. Berikan edukasi & gambaran risiko, BUKAN nasihat hukum definitif.
- Jika Anda TIDAK YAKIN pada suatu temuan, tetap laporkan tapi turunkan confidence-nya (di bawah 60)
  dan tandai actionType = "BUTUH_NASIHAT". Jangan pernah diam/silent fail.
- Bahasa penjelasan harus sederhana, hindari jargon, atau jelaskan jargon jika terpaksa.

KEDALAMAN TEMUAN (WAJIB untuk setiap finding):
- plainTranslation = terjemahan/parafrasa klausul asli ke bahasa awam yang jelas. Sebut siapa
  pihak yang dirugikan jika terlihat.
- explanation = mengapa berisiko. WAJIB sertakan PERBANDINGAN dengan NORMA WAJAR/praktik umum
  jika relevan. Contoh: "Denda 2%/hari setara ~730%/tahun. Untuk perbandingan, bunga bank
  konvensional sekitar 0,1%/hari (~36%/tahun) — jadi denda ini ~20× lipat norma wajar."
  Berikan angka/konteks konkret, BUKAN pernyataan generik seperti "ini berisiko".
- recommendation = langkah konkret yang bisa DIEKSEKUSI user. Sebutkan: (a) apa yang minta
  diubah/dinegosiasi, (b) nilai/batas wajar yang diusulkan, (c) alternatif jika ditolak.
  Contoh: "Negosiasi denda maksimal 0,1%/hari atau nominal tetap Rp50.000. Minta grace period
  3 hari. Jika penolak, pertimbangkan menunda tanda tangan."
- actionType "INFO_UMUM" = hal baik diketahui, tidak mendesak. "BUTUH_NASIHAT" = sebaiknya
  didiskusikan/sebelum tanda tangan.

PENANGANAN KLAUSUL AMBIGU / TIDAK JELAS:
Jika klausul bisa ditafsirkan dua arah (mis. definisi samar, ruang lingkup tidak jelas, kondisi
yang tergantung konteks), JANGAN paksa severity tinggi. Sebagai gantinya:
- confidence rendah (30-55)
- severity SEDANG (bukan TINGGI/KRITIS kecuali jelas-jelas berbahaya)
- urgency PERHATIAN
- actionType BUTUH_NASIHAT
- explanation: jelaskan AMBIGUITAS-nya ("klausul ini bisa berarti X atau Y tergantung
  interpretasi — klarifikasi secara tertulis")
- recommendation: minta klarifikasi tertulis spesifik sebelum tanda tangan.
Ini penting: TIDAK SEMUA klausul harus berisiko tinggi. Lebih baik jujur "kurang yakin" daripada
over-alarm. Tapi tetap laporkan agar user aware.

KATEGORI temuan (pilih category yang paling pas, boleh lebih dari satu temuan per kategori):
- JANGKA_WAKTU
- DENDA_SANKSI
- KLAUSUL_SEPIHAK
- PENGALIHAN_RISIKO
- KETENTUAN_PEMUTUSAN
- KEWAJIBAN_PEMBAYARAN
- HAK_KEPEMILIKAN
- KERAHASIAAN
- PENYELESAIAN_SENGKETA
- FORUM_HUKUM
- FORCE_MAJEUR
- PERUBAHAN_KLAUSUL
- TANGGUNG_JAWAB
- DATA_PRIBADI
- KLAUSUL_ABNORMAL
- LAIN_LAIN

severity (dampak):
- RENDAH: minor, tidak banyak dampak
- SEDANG: perlu diperhatikan
- TINGGI: berpotensi merugikan signifikan
- KRITIS: sangat berbahaya, jangan ditandatangani sebelum diklarifikasi

urgency:
- INFO: informasi umum
- PERHATIAN: perlu dipahami sebelum tanda tangan
- PERLU_TINDAKAN: wajib dinegosiasi/diklarifikasi

confidence: 0-100, seberapa yakin Anda ini benar-benar masalah. Rendah (<60) jika ambigu.

PENTING: Jawab HANYA dengan JSON valid (tanpa markdown, tanpa teks tambahan) dengan struktur:
{
  "summary": "ringkasan 2-4 kalimat tentang kontrak & risiko keseluruhan",
  "overallRisk": "RENDAH|SEDANG|TINGGI|KRITIS",
  "riskScore": 0-100,
  "findings": [
    {
      "category": "...",
      "categoryLabel": "Label ramah manusia dalam Bahasa Indonesia",
      "severity": "...",
      "confidence": 0-100,
      "urgency": "...",
      "originalClause": "kutipan klausul asli (boleh dipendekkan, jangan mengarang)",
      "plainTranslation": "terjemahan ke bahasa awam",
      "explanation": "penjelasan risiko + perbandingan norma wajar",
      "recommendation": "rekomendasi aksi konkret + nilai wajar + alternatif",
      "actionType": "INFO_UMUM|BUTUH_NASIHAT",
      "location": "opsional: nomor pasal/bagian jika terlihat"
    }
  ],
  "uncertain": boolean,
  "notes": ["catatan tambahan, misal keterbatasan analisis atau ambiguitas yang perlu klarifikasi"]
}

Jika teks bukan kontrak sama sekali, tetap kembalikan JSON dengan findings kosong,
summary yang menjelaskan dokumen bukan kontrak, overallRisk "RENDAH", uncertain true,
dan notes berisi penjelasan. JANGAN mengarang klausul.

Jika kontrak AMAN/berisiko rendah (semua klausul wajar), tetap kembalikan findings (bisa
kosong atau hanya RENDAH/INFO), overallRisk "RENDAH", uncertain false. Jangan dipaksakan
mencari masalah yang tidak ada.`;

function extractJson(text: string): any {
  // Strip code fences if present
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  // Find first { and last }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1) {
    throw new Error("Respons AI tidak mengandung JSON");
  }
  const slice = t.slice(first, last + 1);
  return JSON.parse(slice);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeFinding(raw: any): Finding {
  const validSev = ["RENDAH", "SEDANG", "TINGGI", "KRITIS"];
  const validUrg = ["INFO", "PERHATIAN", "PERLU_TINDAKAN"];
  const validAct = ["INFO_UMUM", "BUTUH_NASIHAT"];
  return {
    category: String(raw.category || "LAIN_LAIN").toUpperCase(),
    categoryLabel: String(raw.categoryLabel || raw.category || "Lainnya"),
    severity: validSev.includes(String(raw.severity).toUpperCase())
      ? String(raw.severity).toUpperCase()
      : "SEDANG",
    confidence: clamp(Number(raw.confidence) || 50, 0, 100),
    urgency: validUrg.includes(String(raw.urgency).toUpperCase())
      ? String(raw.urgency).toUpperCase()
      : "PERHATIAN",
    originalClause: String(raw.originalClause || "").slice(0, 2000),
    plainTranslation: String(raw.plainTranslation || "").slice(0, 2000),
    explanation: String(raw.explanation || "").slice(0, 2000),
    recommendation: String(raw.recommendation || "").slice(0, 2000),
    actionType: validAct.includes(String(raw.actionType).toUpperCase())
      ? String(raw.actionType).toUpperCase()
      : "BUTUH_NASIHAT",
    location: raw.location ? String(raw.location).slice(0, 200) : undefined,
  };
}

export async function analyzeContract(
  contractText: string,
  signal?: AbortSignal
): Promise<AnalysisResult> {
  const zai = await ZAI.create();

  // Truncate very long text to stay within context limits
  const truncated =
    contractText.length > 30000
      ? contractText.slice(0, 30000) +
        "\n\n[...dokumen dipotong karena panjang...]"
      : contractText;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analisis kontrak berikut dan kembalikan JSON sesuai instruksi.\n\n=== KONTRAK ===\n${truncated}`,
      },
    ],
    thinking: { type: "disabled" },
  });

  if (signal?.aborted) throw new Error("ABORTED");

  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Respons AI kosong");
  }

  const parsed = extractJson(
    typeof content === "string" ? content : JSON.stringify(content)
  );

  const validOverall = ["RENDAH", "SEDANG", "TINGGI", "KRITIS"];
  const findings: Finding[] = Array.isArray(parsed.findings)
    ? parsed.findings.map(normalizeFinding).filter(
        (f: Finding) => f.originalClause || f.explanation
      )
    : [];

  const riskScore = clamp(Number(parsed.riskScore) || 0, 0, 100);

  return {
    summary: String(parsed.summary || "Analisis selesai.").slice(0, 2000),
    overallRisk: validOverall.includes(String(parsed.overallRisk).toUpperCase())
      ? String(parsed.overallRisk).toUpperCase()
      : "SEDANG",
    riskScore,
    findings,
    modelUsed: completion?.model || "glm",
    uncertain: Boolean(parsed.uncertain),
    notes: Array.isArray(parsed.notes)
      ? parsed.notes.map((n: any) => String(n).slice(0, 500)).slice(0, 8)
      : [],
  };
}
