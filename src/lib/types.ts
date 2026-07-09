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

export interface ResearchSourceDto {
  title: string;
  url: string;
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
  researchEffort?: string | null;
  researchQuery?: string | null;
  researchLatencyMs?: number | null;
  researchContent?: string | null;
  researchSources?: ResearchSourceDto[];
  shareToken?: string | null;
  createdAt: string;
  findings: FindingDto[];
}

export interface AnalysisChatMessageDto {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string | null;
  createdAt: string;
}

export interface AnalysisChatHistoryDto {
  threadId: string | null;
  messages: AnalysisChatMessageDto[];
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
  researchEffort?: string | null;
  researchQuery?: string | null;
  researchLatencyMs?: number | null;
  researchContent?: string | null;
  researchSources?: ResearchSourceDto[];
  shareToken?: string | null;
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
  planExpiresAt?: string | null;
  createdAt: string;
}

export const CATEGORY_META: Record<string, { label: string; emoji: string; description: string; mascotText?: string }> = {
  JANGKA_WAKTU: { label: "Jangka Waktu", emoji: "⏳", description: "Lama berlakunya perjanjian & perpanjangan otomatis", mascotText: "Perhatikan batas waktunya. Kalau otomatis diperpanjang, pastikan kamu gampang buat batalin!" },
  DENDA_SANKSI: { label: "Denda & Sanksi", emoji: "💸", description: "Besaran denda, bunga, dan kewajiban jika melanggar", mascotText: "Aduh, dendanya wajar nggak nih? Coba negosiasikan maksimal penaltinya biar aman." },
  KLAUSUL_SEPIHAK: { label: "Klausul Sepihak", emoji: "⚖️", description: "Ketentuan yang menguntungkan satu pihak secara tidak adil", mascotText: "Hmm, klausul ini kelihatan berat sebelah. Kamu juga berhak dapat keadilan lho!" },
  PENGALIHAN_RISIKO: { label: "Pengalihan Risiko", emoji: "🔄", description: "Risiko dipindahkan sepenuhnya ke Anda", mascotText: "Hati-hati! Kalau ada apa-apa, kamu yang tanggung semua. Jangan sampai setuju kalau bukan salahmu." },
  KETENTUAN_PEMUTUSAN: { label: "Pemutusan Kontrak", emoji: "✂️", description: "Syarat & prosedur mengakhiri perjanjian", mascotText: "Cek baik-baik. Kalau kamu mau putus kontrak duluan, prosesnya susah nggak?" },
  KEWAJIBAN_PEMBAYARAN: { label: "Kewajiban Bayar", emoji: "🧾", description: "Jadwal, metode, & konsekuensi pembayaran", mascotText: "Catat jadwal bayarnya ya. Dan cek apakah ada biaya tersembunyi yang nggak dibilang di awal." },
  HAK_KEPEMILIKAN: { label: "Hak & Kepemilikan", emoji: "🔑", description: "Siapa memiliki apa setelah & selama kontrak", mascotText: "Pastikan aset atau hak kekayaan intelektualmu nggak diambil diam-diam sama pihak sana." },
  KERAHASIAAN: { label: "Kerahasiaan", emoji: "🔒", description: "Kewajiban menjaga rahasia & cakupannya", mascotText: "Kalau ada poin kerahasiaan, pastikan batas waktunya logis. Nggak mungkin rahasia selamanya kan?" },
  PENYELESAIAN_SENGKETA: { label: "Penyelesaian Sengketa", emoji: "🤝", description: "Cara menyelesaikan konflik (mediasi/arbitrase/pengadilan)", mascotText: "Mediasi musyawarah selalu lebih baik dan murah daripada langsung seret ke pengadilan." },
  FORUM_HUKUM: { label: "Forum Hukum", emoji: "🏛️", description: "Pengadilan/hukum mana yang berlaku", mascotText: "Pilih hukum dan pengadilan di kotamu biar nggak repot kalau sampai harus sidang." },
  FORCE_MAJEUR: { label: "Force Majeure", emoji: "🌪️", description: "Keadaan kahar di luar kendali pihak", mascotText: "Kejadian luar biasa (bencana/pandemi) harus bisa membebaskanmu dari denda keterlambatan." },
  PERUBAHAN_KLAUSUL: { label: "Perubahan Klausul", emoji: "📝", description: "Hak mengubah syarat sepihak", mascotText: "Wah, mereka bisa ubah sepihak? Pastikan kamu harus diinfokan dan setuju dulu!" },
  TANGGUNG_JAWAB: { label: "Tanggung Jawab", emoji: "🛡️", description: "Batas tanggung jawab & ganti rugi", mascotText: "Pastikan ada batas maksimal (cap) ganti rugi. Jangan mau disuruh ganti tanpa batas." },
  DATA_PRIBADI: { label: "Data Pribadi", emoji: "🗂️", description: "Pengumpulan & penggunaan data Anda", mascotText: "Data pribadimu berharga. Jangan kasih izin sebar data kalau nggak relevan sama layanannya." },
  KLAUSUL_ABNORMAL: { label: "Klausul Abnormal", emoji: "⚠️", description: "Klausul ganjil/di luar kebiasaan", mascotText: "Klausul ini nggak umum ada di kontrak sejenis. Sebaiknya kamu tanyain langsung maksudnya." },
  LAIN_LAIN: { label: "Lain-lain", emoji: "📌", description: "Catatan lain yang perlu diperhatikan", mascotText: "Poin ini agak beda. Kalau ragu, mending tanyakan langsung atau minta saran legal." },
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
  researchEffort?: string | null;
  researchQuery?: string | null;
  researchLatencyMs?: number | null;
  researchContent?: string | null;
  researchSources?: string | ResearchSourceDto[] | null;
  shareToken?: string | null;
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
    researchEffort: a.researchEffort,
    researchQuery: a.researchQuery,
    researchLatencyMs: a.researchLatencyMs,
    researchContent: a.researchContent,
    researchSources: normalizeResearchSources(a.researchSources),
    shareToken: a.shareToken || null,
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

function normalizeResearchSources(value: string | ResearchSourceDto[] | null | undefined): ResearchSourceDto[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((source: any) => ({
        title: String(source?.title || "Sumber resmi").slice(0, 180),
        url: String(source?.url || ""),
      }))
      .filter((source: ResearchSourceDto) => source.url)
      .slice(0, 12);
  } catch {
    return [];
  }
}
