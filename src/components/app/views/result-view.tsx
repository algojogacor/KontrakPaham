"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SeverityBadge, UrgencyBadge, ActionTypeBadge, RiskPill, ConfidenceBar } from "@/components/app/badges";
import { ConsultationCard } from "@/components/app/consultation-card";
import { Reveal } from "@/components/app/use-scroll-reveal";
import { CATEGORY_META } from "@/lib/types";
import type { FindingDto } from "@/lib/types";
import {
  Download, ArrowLeft, FileText, AlertTriangle, Info, Lightbulb,
  Languages, ShieldAlert, Loader2, Trash2, History, Sparkles, Copy, CheckCircle2, ListChecks,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const SEV_ORDER: Record<string, number> = { KRITIS: 0, TINGGI: 1, SEDANG: 2, RENDAH: 3 };

export function ResultView() {
  const { currentAnalysis, setCurrentAnalysis, setView, user } = useApp();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!currentAnalysis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Tidak ada hasil analisis untuk ditampilkan.</p>
        <Button className="mt-4" onClick={() => setView("history")}>Lihat riwayat</Button>
      </div>
    );
  }

  const a = currentAnalysis;
  const sortedFindings = [...a.findings].sort((x, y) => {
    const s = (SEV_ORDER[x.severity] ?? 9) - (SEV_ORDER[y.severity] ?? 9);
    if (s !== 0) return s;
    return y.confidence - x.confidence;
  });

  const counts = {
    KRITIS: a.findings.filter((f) => f.severity === "KRITIS").length,
    TINGGI: a.findings.filter((f) => f.severity === "TINGGI").length,
    SEDANG: a.findings.filter((f) => f.severity === "SEDANG").length,
    RENDAH: a.findings.filter((f) => f.severity === "RENDAH").length,
  };
  const needsAction = a.findings.filter((f) => f.actionType === "BUTUH_NASIHAT").length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(api.exportUrl(a.id));
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal membuat PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `KontrakPaham-${a.title.slice(0, 40).replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: "PDF report terunduh." });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAnalysis(a.id);
      setCurrentAnalysis(null);
      toast({ title: "Analisis dihapus." });
      setView("history");
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView("history")}>
          <ArrowLeft className="h-4 w-4" /> Riwayat
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setView("checklist")}>
            <ListChecks className="h-4 w-4" /> Checklist
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setView("analyze")}>
            <Sparkles className="h-4 w-4" /> Analisis Baru
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Hapus" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus analisis ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini permanen. Hasil & temuan analisis "{a.title}" akan dihapus selamanya.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Hapus permanen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Header card */}
      <Card className="mt-4 overflow-hidden animate-scale-in">
        <div className={`h-2 w-full bg-gradient-to-r ${riskGradient(a.overallRisk || "SEDANG")}`} />
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{a.sourceType}</span>
                {a.fileName && <span className="truncate">· {a.fileName}</span>}
                <span>· {a.charCount.toLocaleString("id-ID")} karakter</span>
              </div>
              <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">{a.title}</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Dianalisis {format(new Date(a.createdAt), "EEEE, d MMM yyyy · HH:mm", { locale: idLocale })} WIB
                {a.modelUsed && ` · model: ${a.modelUsed}`}
              </p>
            </div>
            {a.overallRisk && <RiskPill risk={a.overallRisk} />}
          </div>

          {/* Risk score + summary */}
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <Info className="h-4 w-4" /> Ringkasan
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{a.summary}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">Skor risiko</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{a.riskScore ?? "-"}<span className="text-base text-muted-foreground">/100</span></p>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                <SevCount label="Krt" count={counts.KRITIS} cls="bg-red-500" />
                <SevCount label="Tgg" count={counts.TINGGI} cls="bg-orange-500" />
                <SevCount label="Sdg" count={counts.SEDANG} cls="bg-amber-500" />
                <SevCount label="Rdh" count={counts.RENDAH} cls="bg-emerald-500" />
              </div>
            </div>
          </div>

          {needsAction > 0 && (
            <Alert className="mt-4 border-amber-300/60 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{needsAction} temuan butuh nasihat lanjutan</AlertTitle>
              <AlertDescription>
                Klausul-klausul ini sebaiknya didiskusikan sebelum Anda menandatangani. Lihat detail di bawah & gunakan jalur konsultasi.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Findings */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Temuan Klausul ({a.findings.length})
          </h2>
        </div>

        {a.findings.length === 0 ? (
          <Card className="mt-4 border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <p className="font-medium">Tidak ada temuan klausul bermasalah</p>
              <p className="text-sm text-muted-foreground">
                Dokumen mungkin bukan kontrak, atau tidak mengandung klausul berisiko signifikan yang bisa dideteksi.
                Tetap baca dengan teliti — analisis ini edukatif, bukan jaminan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={[sortedFindings[0]?.id]} className="mt-4 space-y-3">
            {sortedFindings.map((f, idx) => (
              <Reveal key={f.id} delay={Math.min(idx * 60, 360)}>
                <FindingCard finding={f} index={idx} defaultOpen={idx === 0} />
              </Reveal>
            ))}
          </Accordion>
        )}
      </div>

      {/* Consultation */}
      <div className="mt-8">
        <Reveal>
          <ConsultationCard />
        </Reveal>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <History className="h-3.5 w-3.5" />
        <span>Analisis ini tersimpan di riwayat akun Anda ({user?.username}).</span>
      </div>
    </div>
  );
}

function SevCount({ label, count, cls }: { label: string; count: number; cls: string }) {
  return (
    <div className="rounded-md bg-background p-1.5">
      <div className={`mx-auto h-1.5 w-6 rounded-full ${cls}`} />
      <p className="mt-1 text-sm font-bold tabular-nums">{count}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function FindingCard({ finding, index, defaultOpen }: { finding: FindingDto; index: number; defaultOpen?: boolean }) {
  const meta = CATEGORY_META[finding.category] || CATEGORY_META.LAIN_LAIN;
  const [copied, setCopied] = useState(false);

  const copyFinding = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Temuan Analisis KontrakPaham #${index + 1}
Kategori: ${finding.categoryLabel}
Tingkat: ${finding.severity} | Yakin: ${finding.confidence}% | ${finding.actionType === "BUTUH_NASIHAT" ? "Butuh nasihat" : "Info umum"}

KLAUSUL ASLI:
${finding.originalClause}

BAHASA AWAM:
${finding.plainTranslation}

MENGAPA BERISIKO:
${finding.explanation}

SARAN TINDAKAN:
${finding.recommendation}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <AccordionItem value={finding.id} className="border-b-0">
        <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
          <div className="flex w-full items-start gap-3 pr-2 text-left">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-base">{meta.emoji}</span>
                <span className="font-semibold">{finding.categoryLabel}</span>
                <SeverityBadge severity={finding.severity} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {finding.plainTranslation || finding.originalClause}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <ConfidenceBar value={finding.confidence} />
                <ActionTypeBadge type={finding.actionType} />
                <UrgencyBadge urgency={finding.urgency} />
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-5 sm:px-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Original */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Klausul asli
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-foreground/80">
                "{finding.originalClause}"
              </p>
              {finding.location && (
                <p className="mt-2 text-xs text-muted-foreground">📍 {finding.location}</p>
              )}
            </div>
            {/* Translation */}
            <div className="rounded-lg border border-emerald-300/40 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <Languages className="h-3.5 w-3.5" /> Bahasa awam
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{finding.plainTranslation}</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-4 rounded-lg border border-amber-300/40 bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" /> Mengapa ini berisiko
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{finding.explanation}</p>
          </div>

          {/* Recommendation */}
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                <Lightbulb className="h-3.5 w-3.5" /> Saran tindakan
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={copyFinding}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Salin temuan
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{finding.recommendation}</p>
          </div>

          {finding.confidence < 50 && (
            <Alert className="mt-4 border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                Tingkat keyakinan AI rendah ({finding.confidence}%) pada temuan ini. Jadikan pemicu untuk
                konfirmasi/klarifikasi, bukan kesimpulan final.
              </AlertDescription>
            </Alert>
          )}
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
}

function riskGradient(risk: string) {
  switch (risk) {
    case "RENDAH":
      return "from-emerald-400 to-emerald-500";
    case "SEDANG":
      return "from-amber-400 to-amber-500";
    case "TINGGI":
      return "from-orange-400 to-orange-500";
    case "KRITIS":
      return "from-red-500 to-red-600";
    default:
      return "from-muted to-muted-foreground/40";
  }
}
