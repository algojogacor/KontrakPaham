import type { AnalysisDto, QuotaDto, UserDto } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function handle<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data.error || "Terjadi kesalahan.", res.status, data);
    }
    return data as T;
  }
  if (!res.ok) {
    throw new ApiError(`Permintaan gagal (${res.status}).`, res.status);
  }
  return (await res.text()) as unknown as T;
}

export const api = {
  async getMe(): Promise<{ user: UserDto | null; quota: QuotaDto | null }> {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    return handle(res);
  },
  async signup(body: { username: string; email: string; password: string; displayName?: string }) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handle<{ user: UserDto }>(res);
  },
  async signin(body: { identifier: string; password: string }) {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handle<{ user: UserDto }>(res);
  },
  async signout() {
    const res = await fetch("/api/auth/signout", { method: "POST" });
    return handle<{ ok: true }>(res);
  },
  async forgotPassword(email: string) {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handle<{ message: string; resetToken?: string; expiresIn?: string }>(res);
  },
  async resetPassword(token: string, password: string) {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    return handle<{ message: string }>(res);
  },
  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handle<{ message: string }>(res);
  },
  async deleteAccount() {
    const res = await fetch("/api/auth/account", { method: "DELETE" });
    return handle<{ message: string }>(res);
  },
  async getQuota() {
    const res = await fetch("/api/quota", { cache: "no-store" });
    return handle<{ quota: QuotaDto; limits: any; plan: string }>(res);
  },
  async analyzeText(text: string) {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return handle<{ analysis: AnalysisDto; warnings: string[]; notes: string[]; uncertain: boolean }>(res);
  },
  async analyzeFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/analyze", { method: "POST", body: form });
    return handle<{ analysis: AnalysisDto; warnings: string[]; notes: string[]; uncertain: boolean }>(res);
  },
  async listAnalyses() {
    const res = await fetch("/api/analyses", { cache: "no-store" });
    return handle<{
      analyses: (AnalysisDto & { findingsCount: number })[];
      quota: QuotaDto;
    }>(res);
  },
  async getAnalysis(id: string) {
    const res = await fetch(`/api/analyses/${id}`, { cache: "no-store" });
    return handle<{ analysis: AnalysisDto }>(res);
  },
  async deleteAnalysis(id: string) {
    const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
    return handle<{ message: string }>(res);
  },
  exportUrl(id: string) {
    return `/api/analyses/${id}/export`;
  },
  async getInsights() {
    const res = await fetch("/api/insights", { cache: "no-store" });
    return handle<{
      total: number;
      avgRiskScore: number;
      riskDistribution: Record<string, number>;
      categoryFrequency: { category: string; label: string; count: number }[];
      sourceTypeDistribution: Record<string, number>;
      recentTrend: { id: string; title: string; riskScore: number; overallRisk: string | null; createdAt: string }[];
      topRiskyCategories: { category: string; label: string; count: number }[];
      needsActionCount: number;
    }>(res);
  },
};

export function friendlyError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return "Anda terlalu sering mencoba. Tunggu sebentar lalu coba lagi.";
    if (e.status === 401) return "Sesi Anda berakhir. Silakan masuk kembali.";
    if (e.status === 402) return e.message;
    if (e.status === 413) return e.message;
    return e.message;
  }
  if (e instanceof Error) {
    if (e.message === "Failed to fetch") return "Koneksi terputus. Periksa internet Anda lalu coba lagi.";
    return e.message;
  }
  return "Terjadi kesalahan tak terduga. Silakan coba lagi.";
}
