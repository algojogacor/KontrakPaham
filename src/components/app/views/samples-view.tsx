"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  FileText,
  Loader2,
  Lock,
  Play,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContractLoading } from "@/components/app/contract-loading";
import { ViewShell } from "@/components/app/view-shell";
import { api, friendlyError } from "@/lib/api-client";
import { SAMPLE_CONTRACTS, type SampleContract } from "@/lib/content";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const DIFFICULTY_META: Record<string, { label: string; cls: string }> = {
  pemula: { label: "Pemula", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" },
  menengah: { label: "Menengah", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  lanjutan: { label: "Lanjutan", cls: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" },
};

export function SamplesView() {
  const { setView, user, setCurrentAnalysis, setQuota } = useApp();
  const [preview, setPreview] = useState<SampleContract | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const runSample = async (s: SampleContract) => {
    if (!user) {
      toast({ title: "Masuk dulu untuk menganalisis.", description: "Daftar gratis untuk 3 analisis/bulan." });
      setView("signup");
      return;
    }
    setAnalyzing(s.id);
    setPreview(null);
    toast({ title: `Menganalisis "${s.title}"...`, description: "Tunggu sebentar, sedang diproses." });
    try {
      const res = await api.analyzeText(s.text);
      setCurrentAnalysis(res.analysis);
      try {
        const q = await api.getQuota();
        setQuota(q.quota);
      } catch {
        /* ignore */
      }
      setView("result");
      toast({ title: "Analisis selesai!", description: `${res.analysis.findings.length} temuan ditemukan.` });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setAnalyzing(null);
    }
  };

  if (preview) {
    return (
      <ViewShell
        size="narrow"
        eyebrow="Pratinjau contoh"
        title={preview.title}
        description={preview.description}
        icon={FileText}
        actions={
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setPreview(null)}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      >
        <Card className="border-border/70 shadow-soft-lg">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{preview.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{preview.category}</Badge>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", DIFFICULTY_META[preview.difficulty].cls)}>
                    {DIFFICULTY_META[preview.difficulty].label}
                  </span>
                  <Badge variant="outline">{preview.charCount.toLocaleString("id-ID")} karakter</Badge>
                </div>
              </div>
            </div>
            <pre className="mt-5 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-xs leading-relaxed scroll-area">
{preview.text}
            </pre>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setPreview(null)}>Tutup</Button>
              <Button className="gap-2" onClick={() => runSample(preview)} disabled={analyzing === preview.id}>
                {analyzing === preview.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analisis Contoh Ini
              </Button>
            </div>
          </CardContent>
        </Card>
      </ViewShell>
    );
  }

  return (
    <ViewShell
      size="medium"
      eyebrow="Coba tanpa dokumen"
      title="Contoh Kontrak untuk Dicoba"
      description="Belum punya kontrak? Jalankan contoh nyata untuk melihat bagaimana KontrakPaham menandai klausul berisiko."
      icon={FileText}
      actions={
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView("home")}>
          <ArrowLeft className="h-4 w-4" /> Beranda
        </Button>
      }
    >
      {analyzing && (
        <Card className="mb-6 overflow-hidden border-primary/30 bg-primary/5">
          <CardContent className="p-5 sm:p-6">
            <ContractLoading
              compact
              title="Menganalisis contoh kontrak..."
              detail="Kami sedang membaca pasal, risiko, dan bahasa awamnya."
            />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["Membaca", "Memvalidasi", "Menganalisis", "Selesai"].map((step, i) => (
                <div key={i} className="rounded-md bg-background/70 p-2 text-center">
                  <div className="mx-auto mb-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: analyzing ? "100%" : "0%", transitionDelay: `${i * 400}ms` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="mb-6 border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Untuk menganalisis contoh, Anda perlu masuk akun gratis.{" "}
              <button onClick={() => setView("signup")} className="font-semibold underline underline-offset-2">
                Daftar sekarang
              </button>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {SAMPLE_CONTRACTS.map((s) => (
          <Card key={s.id} className="group flex flex-col border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
            <CardContent className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-3xl">{s.emoji}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", DIFFICULTY_META[s.difficulty].cls)}>
                  {DIFFICULTY_META[s.difficulty].label}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-ink">{s.title}</h3>
              <Badge variant="secondary" className="mt-1.5 w-fit text-[10px]">{s.category}</Badge>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreview(s)}>
                  <Eye className="h-4 w-4" /> Lihat teks
                </Button>
                <Button size="sm" className="gap-1.5 flex-1" onClick={() => runSample(s)} disabled={analyzing === s.id}>
                  {analyzing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Analisis
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Punya kontrak sendiri untuk dianalisis?{" "}
            <button onClick={() => setView(user ? "analyze" : "signup")} className="font-semibold text-primary hover:underline">
              {user ? "Unggah kontrak Anda" : "Daftar & mulai"}
            </button>
          </p>
        </CardContent>
      </Card>
    </ViewShell>
  );
}
