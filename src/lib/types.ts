export type SourceType = "TEXT" | "PDF" | "DOCX";
export type Severity = "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
export type Urgency = "INFO" | "PERHATIAN" | "PERLU_TINDAKAN";
export type ActionType = "INFO_UMUM" | "BUTUH_NASIHAT";
export type OverallRisk = "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";

export interface FindingDto {
  id: string;
  category: string;
  categoryLabel: string;
  severity: Severity;
  confidence: number;
  urgency: Urgency;
  originalClause: string;
  plainTranslation: string;
  explanation: string;
  recommendation: string;
  actionType: ActionType;
  location?: string | null;
}

export interface AnalysisDto {
  id: string;
  title: string;
  sourceType: SourceType;
  fileName?: string | null;
  language: string;
  charCount: number;
  summary?: string | null;
  overallRisk?: OverallRisk | null;
  riskScore?: number | null;
  status: string;
  errorMessage?: string | null;
  modelUsed?: string | null;
  createdAt: string;
  findings: FindingDto[];
}

export interface AnalysisWithFindings {
  id: string;
  title: string;
  sourceType: SourceType;
  fileName?: string | null;
  language: string;
  charCount: number;
  summary?: string | null;
  overallRisk?: OverallRisk | null;
  riskScore?: number | null;
  status: string;
  errorMessage?: string | null;
  modelUsed?: string | null;
  createdAt: Date;
  findings: FindingDto[];
  notes?: string[];
}

export interface QuotaDto {
  used: number;
  limit: number;
  remaining: number;
  month: number;
  year: number;
  plan: string;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  plan: string;
  createdAt: string;
}

export const CATEGORY_META: Record<string, { label: string; emoji: string; description: string }> = {
  JANGKA_WAKTU: { label: "Jangka Waktu", emoji: "⏳", description: "Lama berlakunya perjanjian & perpanjangan otomatis" },
  DENDA_SANKSI: { label: "Denda & Sanksi", emoji: "💸", description: "Besaran denda, bunga, dan kewajiban jika melanggar" },
  KLAUSUL_SEPIHAK: { label: "Klausul Sepihak", emoji: "⚖️", description: "Ketentuan yang menguntungkan satu pihak secara tidak adil" },
  PENGALIHAN_RISIKO: { label: "Pengalihan Risiko", emoji: "🔄", description: "Risiko dipindahkan sepenuhnya ke Anda" },
  KETENTUAN_PEMUTUSAN: { label: "Pemutusan Kontrak", emoji: "✂️", description: "Syarat & prosedur mengakhiri perjanjian" },
  KEWAJIBAN_PEMBAYARAN: { label: "Kewajiban Bayar", emoji: "🧾", description: "Jadwal, metode, & konsekuensi pembayaran" },
  HAK_KEPEMILIKAN: { label: "Hak & Kepemilikan", emoji: "🔑", description: "Siapa memiliki apa setelah & selama kontrak" },
  KERAHASIAAN: { label: "Kerahasiaan", emoji: "🔒", description: "Kewajiban menjaga rahasia & cakupannya" },
  PENYELESAIAN_SENGKETA: { label: "Penyelesaian Sengketa", emoji: "🤝", description: "Cara menyelesaikan konflik (mediasi/arbitrase/pengadilan)" },
  FORUM_HUKUM: { label: "Forum Hukum", emoji: "🏛️", description: "Pengadilan/hukum mana yang berlaku" },
  FORCE_MAJEUR: { label: "Force Majeure", emoji: "🌪️", description: "Keadaan kahar di luar kendali pihak" },
  PERUBAHAN_KLAUSUL: { label: "Perubahan Klausul", emoji: "📝", description: "Hak mengubah syarat sepihak" },
  TANGGUNG_JAWAB: { label: "Tanggung Jawab", emoji: "🛡️", description: "Batas tanggung jawab & ganti rugi" },
  DATA_PRIBADI: { label: "Data Pribadi", emoji: "🗂️", description: "Pengumpulan & penggunaan data Anda" },
  KLAUSUL_ABNORMAL: { label: "Klausul Abnormal", emoji: "⚠️", description: "Klausul ganjil/di luar kebiasaan" },
  LAIN_LAIN: { label: "Lain-lain", emoji: "📌", description: "Catatan lain yang perlu diperhatikan" },
};

export function toAnalysisDto(a: {
  id: string;
  title: string;
  sourceType: string;
  fileName?: string | null;
  language: string;
  charCount: number;
  summary?: string | null;
  overallRisk?: string | null;
  riskScore?: number | null;
  status: string;
  errorMessage?: string | null;
  modelUsed?: string | null;
  createdAt: Date;
  findings: FindingDto[];
}): AnalysisDto {
  return {
    id: a.id,
    title: a.title,
    sourceType: a.sourceType as SourceType,
    fileName: a.fileName,
    language: a.language,
    charCount: a.charCount,
    summary: a.summary,
    overallRisk: (a.overallRisk as OverallRisk) || null,
    riskScore: a.riskScore,
    status: a.status,
    errorMessage: a.errorMessage,
    modelUsed: a.modelUsed,
    createdAt: a.createdAt.toISOString(),
    findings: (a.findings || []).map((f: FindingDto) => ({
      id: f.id,
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
  };
}
