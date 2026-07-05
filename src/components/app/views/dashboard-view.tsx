"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RiskPill } from "@/components/app/badges";
import { ConsultationCard } from "@/components/app/consultation-card";
import { CompanionFigure } from "@/components/app/custom-svg";
import { FileSearch, FileText, Plus, History, Clock, Sparkles, TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { AnalysisDto, QuotaDto } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

type HistoryItem = AnalysisDto & { findingsCount: number };

export function DashboardView() {
  const { user, quota, setView, setQuota, setCurrentAnalysis } = useApp();
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.listAnalyses();
        if (cancelled) return;
        setItems(data.analyses);
        setQuota(data.quota);
      } catch (e) {
        if (!cancelled) setError(friendlyError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setQuota]);

  const openAnalysis = async (id: string) => {
    toast({ title: "Memuat analisis…" });
    try {
      const { analysis } = await api.getAnalysis(id);
      setCurrentAnalysis(analysis);
      setView("result");
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    }
  };

  const q = quota;
  const usedPct = q ? Math.round((q.used / Math.max(q.limit, 1)) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Halo, {user?.displayName || user?.username} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ringkasan aktivitas analisis kontrak Anda.
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setView("analyze")}>
          <Plus className="h-4 w-4" /> Analisis Kontrak Baru
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Kuota bulan ini</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            {q ? (
              <>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{q.used}</span>
                  <span className="text-sm text-muted-foreground">/ {q.limit} analisis</span>
                </div>
                <Progress value={usedPct} className="mt-2 h-1.5" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {q.remaining > 0 ? `${q.remaining} analisis tersisa` : "Kuota habis — upgrade PRO"}
                </p>
              </>
            ) : (
              <Skeleton className="mt-2 h-8 w-24" />
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => items && items.length > 0 && setView("insights")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total analisis</span>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold">{items?.length ?? 0}</span>
              <span className="text-sm text-muted-foreground">tercatat</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {items && items.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-primary">Lihat insight & statistik →</span>
              ) : "Riwayat tersimpan per akun."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Paket aktif</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold uppercase">{user?.plan}</span>
            </div>
            <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => setView("pricing")}>
              Lihat opsi paket →
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent analyses */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <History className="h-4 w-4" /> Analisis terbaru
            </h2>
            {items && items.length > 4 && (
              <Button variant="ghost" size="sm" onClick={() => setView("history")}>
                Lihat semua
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="mt-2 h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items && items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <CompanionFigure size={64} className="animate-float" />
                <div>
                  <h3 className="font-display font-semibold text-ink">Belum ada analisis</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mulai analisis kontrak pertama Anda. Cukup unggah PDF/DOCX atau tempel teks.
                  </p>
                </div>
                <Button onClick={() => setView("analyze")} className="gap-2 rounded-full">
                  <Plus className="h-4 w-4" /> Analisis sekarang
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items?.slice(0, 5).map((a) => (
                <Card key={a.id} className="cursor-pointer transition-shadow hover:shadow-md" >
                  <button onClick={() => openAnalysis(a.id)} className="w-full text-left">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {a.sourceType === "PDF" ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : a.sourceType === "DOCX" ? (
                          <FileText className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileSearch className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{a.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: idLocale })}</span>
                          <span>· {a.findingsCount} temuan</span>
                          {a.fileName && <span className="truncate">· {a.fileName}</span>}
                        </p>
                      </div>
                      {a.status === "COMPLETED" && a.overallRisk ? (
                        <RiskPill risk={a.overallRisk} size="sm" />
                      ) : a.status === "FAILED" ? (
                        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Gagal</span>
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </CardContent>
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Side */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-primary/20">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Tips cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Fokus dulu</strong> pada temuan berlabel KRITIS & TINGGI —
                itulah yang paling perlu dinegosiasi sebelum tanda tangan.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Dokumen lebih jelas = hasil lebih akurat.</strong> Untuk PDF
                scan, pastikan tulisan terbaca. OCR otomatis akan mencoba membantu.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Bandingkan klausul</strong> dari beberapa penawaran dengan
                menganalisis semuanya, lalu pilih yang paling minim risiko.
              </p>
            </CardContent>
          </Card>
          <ConsultationCard compact />
        </div>
      </div>
    </div>
  );
}
