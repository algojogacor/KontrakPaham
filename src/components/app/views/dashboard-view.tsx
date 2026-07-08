"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  BarChart3,
  Clock,
  FileSearch,
  FileText,
  History,
  LayoutDashboard,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskPill } from "@/components/app/badges";
import { ConsultationCard } from "@/components/app/consultation-card";
import { MetricCard, ViewShell } from "@/components/app/view-shell";
import { api, friendlyError } from "@/lib/api-client";
import { useApp } from "@/lib/store";
import type { AnalysisDto } from "@/lib/types";
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
    toast({ title: "Memuat analisis..." });
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
    <ViewShell
      eyebrow="Ruang kerja"
      title={`Halo, ${user?.displayName || user?.username}`}
      description="Pantau kuota, lanjutkan hasil terakhir, dan mulai analisis baru dari satu tempat."
      icon={LayoutDashboard}
      actions={
        <Button size="lg" className="gap-2" onClick={() => setView("analyze")}>
          <Plus className="h-4 w-4" /> Analisis Kontrak Baru
        </Button>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Kuota bulan ini"
          icon={Sparkles}
          tone="primary"
          value={
            q ? (
              <>
                <span>{q.used}</span>
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ {q.limit} analisis</span>
              </>
            ) : (
              <Skeleton className="h-8 w-24" />
            )
          }
          detail={q ? (q.remaining > 0 ? `${q.remaining} analisis tersisa` : "Kuota habis - upgrade PRO") : undefined}
        >
          {q && <Progress value={usedPct} className="h-1.5" />}
        </MetricCard>

        <MetricCard
          label="Total analisis"
          icon={BarChart3}
          onClick={() => items && items.length > 0 && setView("insights")}
          value={
            <>
              <span>{items?.length ?? 0}</span>
              <span className="ml-1 text-sm font-normal text-muted-foreground">tercatat</span>
            </>
          }
          detail={items && items.length > 0 ? <span className="text-primary">Lihat insight & statistik -&gt;</span> : "Riwayat tersimpan per akun."}
        />

        <MetricCard
          label="Paket aktif"
          icon={TrendingUp}
          tone="amber"
          value={<span className="uppercase">{user?.plan}</span>}
          detail={
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setView("pricing")}>
              Lihat opsi paket -&gt;
            </Button>
          }
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <History className="h-4 w-4 text-primary" /> Analisis terbaru
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
            <Card className="border-dashed bg-card/70">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileSearch className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">Belum ada analisis</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mulai analisis kontrak pertama Anda. Cukup unggah PDF/DOCX atau tempel teks.
                  </p>
                </div>
                <Button onClick={() => setView("analyze")} className="gap-2">
                  <Plus className="h-4 w-4" /> Analisis sekarang
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items?.slice(0, 5).map((a) => (
                <Card key={a.id} className="cursor-pointer border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
                  <button onClick={() => openAnalysis(a.id)} className="w-full text-left">
                    <CardContent className="grid gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {a.sourceType === "PDF" ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : a.sourceType === "DOCX" ? (
                          <FileText className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileSearch className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: idLocale })}
                          </span>
                          <span>- {a.findingsCount} temuan</span>
                          {a.fileName && <span className="truncate">- {a.fileName}</span>}
                        </p>
                      </div>
                      <div className="justify-self-start sm:justify-self-end">
                        {a.status === "COMPLETED" && a.overallRisk ? (
                          <RiskPill risk={a.overallRisk} size="sm" />
                        ) : a.status === "FAILED" ? (
                          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Gagal</span>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <Card className="overflow-hidden border-primary/20 bg-card/80">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Tips cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Fokus dulu</strong> pada temuan berlabel KRITIS & TINGGI -
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
        </aside>
      </div>
    </ViewShell>
  );
}
