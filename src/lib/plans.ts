export interface PlanLimits {
  analysesPerMonth: number;
  maxFileBytes: number;
  maxChars: number;
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    analysesPerMonth: 3,
    maxFileBytes: 5 * 1024 * 1024,
    maxChars: 50_000,
    features: [
      "3 analisis per bulan",
      "Upload PDF / DOCX / teks",
      "Deteksi klausul bermasalah",
      "Penjelasan bahasa awam",
      "Export PDF report",
    ],
  },
  LITE: {
    analysesPerMonth: 20,
    maxFileBytes: 10 * 1024 * 1024,
    maxChars: 100_000,
    features: [
      "20 analisis per bulan",
      "Upload PDF / DOCX / teks",
      "File hingga 10 MB",
      "Teks hingga 100.000 karakter",
      "Export PDF report",
      "Riwayat analisis tersimpan",
    ],
  },
  PRO: {
    analysesPerMonth: 75,
    maxFileBytes: 20 * 1024 * 1024,
    maxChars: 200_000,
    features: [
      "75 analisis per bulan",
      "File hingga 20 MB",
      "Teks hingga 200.000 karakter",
      "Semua fitur LITE",
      "Prioritas antrean analisis",
      "Konsultasi lanjutan",
    ],
  },
  ADMIN: {
    analysesPerMonth: 9999,
    maxFileBytes: 50 * 1024 * 1024,
    maxChars: 500_000,
    features: [
      "Akses admin",
      "Generate license code",
      "Kuota internal besar",
      "Semua fitur PRO",
    ],
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}
