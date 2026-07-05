"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RiskPill } from "@/components/app/badges";
import { EmptyState } from "@/components/app/empty-state";
import {
  ArrowLeft, BarChart3, TrendingUp, AlertTriangle, PieChart,
  FileText, Sparkles, Plus, Activity, Target,
} from "lucide-react";
import type { OverallRisk } from "@/lib/types";

interface Insights {
  total: number;
  avgRiskScore: number;
  riskDistribution: Record<string, number>;
  categoryFrequency: { category: string; label: string; count: number }[];
  sourceTypeDistribution: Record<string, number>;
  recentTrend: { id: string; title: string; riskScore: number; overallRisk: string | null; createdAt: string }[];
  topRiskyCategories: { category: string; label: string; count: number }[];
  needsActionCount: number;
}

const RISK_COLORS: Record<string, string> = {
  RENDAH: "bg-emerald-500",
  SEDANG: "bg-amber-500",
  TINGGI: "bg-orange-500",
  KRITIS: "bg-red-500",
};

const RISK_LABEL: Record<string, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
  KRITIS: "Kritis",
};

export function InsightsView() {
  const { setView } = useApp();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const d = await api.getInsights();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(friendlyError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="mt-6 h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => setView("dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>
        <EmptyState
          icon={BarChart3}
          title="Belum ada data untuk diinsight"
          desc="Analisis minimal 1 kontrak untuk mulai melihat pola risiko & statistik Anda."
          action={<Button onClick={() => setView("analyze")} className="gap-1.5"><Plus className="h-4 w-4" /> Analisis Kontrak</Button>}
        />
      </div>
    );
  }

  const totalFindings = data.categoryFrequency.reduce((s, c) => s + c.count, 0);
  const maxCatCount = Math.max(...data.categoryFrequency.map((c) => c.count), 1);
  const riskEntries = Object.entries(data.riskDistribution).sort(
    (a, b) => (["KRITIS", "TINGGI", "SEDANG", "RENDAH"].indexOf(b[0]) - ["KRITIS", "TINGGI", "SEDANG", "RENDAH"].indexOf(a[0]))
  );
  const riskTotal = riskEntries.reduce((s, [, v]) => s + v, 0);
  const srcEntries = Object.entries(data.sourceTypeDistribution);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => setView("dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insight & Statistik</h1>
          <p className="text-sm text-muted-foreground">Pola risiko dari {data.total} analisis kontrak Anda.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total analisis</span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{data.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">{totalFindings} total temuan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rata-rata skor risiko</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{data.avgRiskScore}<span className="text-base text-muted-foreground">/100</span></p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${data.avgRiskScore >= 70 ? "bg-red-500" : data.avgRiskScore >= 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${data.avgRiskScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Butuh nasihat</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{data.needsActionCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">temuan perlu tindakan lanjutan</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4 text-primary" /> Distribusi Risiko
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskEntries.map(([risk, count]) => {
              const pct = riskTotal > 0 ? Math.round((count / riskTotal) * 100) : 0;
              return (
                <div key={risk}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{RISK_LABEL[risk] || risk}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${RISK_COLORS[risk] || "bg-muted-foreground"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {riskEntries.map(([risk]) => (
                <RiskPill key={risk} risk={risk as OverallRisk} size="sm" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Kategori Paling Sering Bermasalah
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topRiskyCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada temuan.</p>
            ) : (
              <div className="space-y-2.5">
                {data.topRiskyCategories.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{c.label}</span>
                        <span className="text-muted-foreground">{c.count}×</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(c.count / maxCatCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Tren Skor Risiko Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTrend.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data tren.</p>
            ) : (
              <>
                <div className="flex h-40 items-end gap-2">
                  {data.recentTrend.map((t) => (
                    <div key={t.id} className="group flex flex-1 flex-col items-center gap-1">
                      <div className="relative flex w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            t.riskScore >= 70 ? "bg-red-500/80" : t.riskScore >= 40 ? "bg-amber-500/80" : "bg-emerald-500/80"
                          } group-hover:opacity-100 opacity-80`}
                          style={{ height: `${Math.max(8, t.riskScore)}%` }}
                          title={`${t.title}: ${t.riskScore}/100`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{t.riskScore}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {data.recentTrend.length} analisis terbaru (kiri = terlama). Tinggi bar = skor risiko tinggi.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Insight:</strong> {" "}
            {data.avgRiskScore >= 60
              ? "Rata-rata kontrak Anda berisiko cukup tinggi. Pertimbangkan lebih teliti menegosiasi klausul sebelum tanda tangan."
              : data.avgRiskScore >= 35
                ? "Risiko kontrak Anda bervariasi. Fokus pada temuan KRITIS & TINGGI dulu."
                : "Kontrak yang Anda tanda tangani relatif aman. Tetap waspadai temuan baru."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
