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
import { MascotViewer } from "@/components/app/mascot-viewer";
import { ViewShell } from "@/components/app/view-shell";
import { api, friendlyError } from "@/lib/api-client";
import { SAMPLE_CONTRACTS, type SampleContract } from "@/lib/content";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const DIFFICULTY_META: Record<string, { label: string; cls: string }> = {
  pemula: { label: "Pemula", cls: "border-primary/25 text-primary" },
  menengah: { label: "Menengah", cls: "border-amber-500/35 text-amber-700 dark:text-amber-300" },
  lanjutan: { label: "Lanjutan", cls: "border-red-500/35 text-red-700 dark:text-red-300" },
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{preview.category}</Badge>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", DIFFICULTY_META[preview.difficulty].cls)}>
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

      <div className="sample-ledger overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-soft-lg">
        {SAMPLE_CONTRACTS.map((s, index) => (
          <article key={s.id} className="sample-ledger-row">
            <div className="sample-ledger-row__index">{String(index + 1).padStart(2, "0")}</div>
            <div className="sample-ledger-row__icon">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-semibold leading-tight text-ink">{s.title}</h3>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]", DIFFICULTY_META[s.difficulty].cls)}>
                  {DIFFICULTY_META[s.difficulty].label}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>{s.category}</span>
                <span>{s.charCount.toLocaleString("id-ID")} karakter</span>
              </div>
            </div>
            <div className="sample-ledger-row__actions">
              <Button variant="outline" size="sm" className="h-10 gap-1.5 rounded-xl" onClick={() => setPreview(s)}>
                <Eye className="h-4 w-4" /> Lihat
              </Button>
              <Button size="sm" className="h-10 gap-1.5 rounded-xl" onClick={() => runSample(s)} disabled={analyzing === s.id}>
                {analyzing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Analisis
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Card className="mt-8 overflow-hidden border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-center gap-4 p-5 text-center sm:justify-between sm:text-left">
          <MascotViewer
            compact
            model="light"
            interactive={false}
            className="hidden h-20 w-24 shrink-0 sm:block"
            label="Maskot KontrakPaham memegang kontrak"
          />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-ink">Sudah siap uji kontrak sendiri?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unggah dokumen Anda setelah mencoba contoh, lalu bandingkan risiko dan saran tindakan.
            </p>
          </div>
          <Button onClick={() => setView(user ? "analyze" : "signup")} className="hidden shrink-0 rounded-full sm:inline-flex">
            {user ? "Unggah kontrak" : "Daftar & mulai"}
          </Button>
          <button onClick={() => setView(user ? "analyze" : "signup")} className="font-semibold text-primary hover:underline sm:hidden">
            {user ? "Unggah kontrak Anda" : "Daftar & mulai"}
          </button>
        </CardContent>
      </Card>
    </ViewShell>
  );
}
