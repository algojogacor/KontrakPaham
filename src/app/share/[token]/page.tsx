"use client";

import { useEffect, useState, use } from "react";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SeverityBadge, UrgencyBadge, ActionTypeBadge, RiskPill, ConfidenceBar } from "@/components/app/badges";
import { CATEGORY_META } from "@/lib/types";
import type { AnalysisDto, FindingDto } from "@/lib/types";
import {
  Download, FileText, AlertTriangle, Info, Lightbulb,
  Languages, ShieldAlert, Loader2, Sparkles, Copy, CheckCircle2,
  ExternalLink, BookOpen, Quote, Home,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { SiteNav } from "@/components/app/site-nav";
import { SiteFooter } from "@/components/app/site-footer";

const SEV_ORDER: Record<string, number> = { KRITIS: 0, TINGGI: 1, SEDANG: 2, RENDAH: 3 };

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [analysis, setAnalysis] = useState<AnalysisDto | null>(null);
  const [sharedBy, setSharedBy] = useState<string>("Pengguna");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sevFilter, setSevFilter] = useState<string>("ALL");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Update page document title dynamically
  useEffect(() => {
    if (analysis) {
      document.title = `KontrakPaham — Hasil Analisis: ${analysis.title}`;
    }
  }, [analysis]);

  useEffect(() => {
    if (analysis?.findings && analysis.findings.length > 0) {
      const sorted = [...analysis.findings].sort((x, y) => {
        const s = (SEV_ORDER[x.severity] ?? 9) - (SEV_ORDER[y.severity] ?? 9);
        if (s !== 0) return s;
        return y.confidence - x.confidence;
      });
      setExpandedIds([sorted[0].id]);
    }
  }, [analysis]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!analysis) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "e") {
        e.preventDefault();
        handleExport();
      } else if (e.key === "j" || e.key === "k") {
        const sorted = [...analysis.findings].sort((x, y) => {
          const s = (SEV_ORDER[x.severity] ?? 9) - (SEV_ORDER[y.severity] ?? 9);
          if (s !== 0) return s;
          return y.confidence - x.confidence;
        });
        const currentFindings = sevFilter === "ALL" ? sorted : sorted.filter((f) => f.severity === sevFilter);
        if (currentFindings.length === 0) return;
        e.preventDefault();
        const currentIdx = currentFindings.findIndex((f) => expandedIds.includes(f.id));
        let nextIdx = 0;
        if (e.key === "j") {
          nextIdx = currentIdx + 1 < currentFindings.length ? currentIdx + 1 : 0;
        } else {
          nextIdx = currentIdx - 1 >= 0 ? currentIdx - 1 : currentFindings.length - 1;
        }
        const nextId = currentFindings[nextIdx]?.id;
        if (nextId) {
          setExpandedIds([nextId]);
          document.getElementById(`finding-item-${nextId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [analysis, expandedIds, sevFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/share/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal memuat analisis.");
        }
        if (!cancelled) {
          setAnalysis(data.analysis);
          setSharedBy(data.sharedBy);
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteNav />
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Memuat hasil analisis yang dibagikan...</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteNav />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold">Analisis Tidak Ditemukan</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {error || "Tautan berbagi mungkin sudah tidak aktif atau dicabut oleh pemiliknya."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" /> Ke Beranda
            </Link>
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const a = analysis;
  const sortedFindings = [...a.findings].sort((x, y) => {
    const s = (SEV_ORDER[x.severity] ?? 9) - (SEV_ORDER[y.severity] ?? 9);
    if (s !== 0) return s;
    return y.confidence - x.confidence;
  });
  const filteredFindings = sevFilter === "ALL"
    ? sortedFindings
    : sortedFindings.filter((f) => f.severity === sevFilter);

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />
      
      {/* Share banner */}
      <div className="border-b bg-primary/5 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 text-sm sm:flex-nowrap">
          <div className="flex items-center gap-2 text-foreground/80">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>
              Anda sedang melihat analisis publik yang dibagikan oleh <strong>{sharedBy}</strong>.
            </span>
          </div>
          <Button size="xs" asChild className="rounded-full shrink-0">
            <Link href="/" className="gap-1.5 font-medium">
              Analisis Kontrak Anda <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Top action bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Tampilan Publik Read-Only
            </span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export PDF
            </Button>
          </div>

          {/* Header card */}
          <Card className="mt-4 overflow-hidden shadow-soft">
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
                  <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl font-display text-ink">{a.title}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dianalisis {format(new Date(a.createdAt), "EEEE, d MMM yyyy · HH:mm", { locale: idLocale })} WIB
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
                    Klausul-klausul ini sebaiknya didiskusikan dengan bantuan hukum profesional sebelum kontrak ditandatangani.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <ResearchSourcesCard analysis={a} />

          {/* Findings */}
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Temuan Klausul ({a.findings.length})
              </h2>
              {/* Severity filter */}
              {a.findings.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {["ALL", "KRITIS", "TINGGI", "SEDANG", "RENDAH"].map((sev) => {
                    const count = sev === "ALL" ? a.findings.length : (counts as any)[sev] || 0;
                    if (sev !== "ALL" && count === 0) return null;
                    const active = sevFilter === sev;
                    return (
                      <button
                        key={sev}
                        onClick={() => setSevFilter(sev)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        {sev === "ALL" ? "Semua" : sev}
                        <span className={`tabular-nums ${active ? "opacity-80" : "text-muted-foreground"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {a.findings.length === 0 ? (
              <Card className="mt-4 border-dashed">
                <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Tidak ada temuan klausul bermasalah</p>
                  <p className="text-sm text-muted-foreground">
                    Dokumen tidak mengandung klausul berisiko signifikan yang terdeteksi.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Accordion type="multiple" value={expandedIds} onValueChange={setExpandedIds} className="mt-4 space-y-3">
                  {filteredFindings.map((f, idx) => (
                    <FindingCard key={f.id} finding={f} index={idx} defaultOpen={idx === 0} />
                  ))}
                </Accordion>
                {filteredFindings.length === 0 && a.findings.length > 0 && (
                  <Card className="mt-4 border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      Tidak ada temuan dengan severity "{sevFilter}".
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          <div className="mt-8 text-center border-t pt-8">
            <h3 className="font-semibold text-foreground">Ingin menganalisis dokumen hukum Anda sendiri?</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Daftar akun gratis di KontrakPaham untuk mengunggah PDF/DOCX, mendeteksi risiko klausul otomatis, dan menyusun draf negosiasi secara instan.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/">
                Mulai Analisis Gratis Sekarang
              </Link>
            </Button>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}

// Renders simple markdown: headings (###), **bold**, - bullets, [[n]] citations
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="my-1.5 ml-4 space-y-0.5 list-none">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>{inlineFormat(item)}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets(`bl-${i}`);
      return;
    }
    if (trimmed.startsWith("### ")) {
      flushBullets(`bl-${i}`);
      elements.push(
        <p key={i} className="mt-3 mb-0.5 text-xs font-bold uppercase tracking-widest text-primary/80">
          {inlineFormat(trimmed.slice(4))}
        </p>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushBullets(`bl-${i}`);
      elements.push(
        <p key={i} className="mt-3 mb-0.5 text-sm font-bold text-foreground">
          {inlineFormat(trimmed.slice(3))}
        </p>
      );
      return;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      bulletBuffer.push(trimmed.slice(2));
      return;
    }
    flushBullets(`bl-${i}`);
    elements.push(
      <p key={i} className="text-sm leading-relaxed text-foreground/80">
        {inlineFormat(trimmed)}
      </p>
    );
  });
  flushBullets("bl-end");
  return <div className="space-y-0.5">{elements}</div>;
}

function inlineFormat(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\[\[\d+\]\])/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else {
      const num = token.slice(2, -2);
      parts.push(
        <sup key={match.index}>
          <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary/15 px-1 text-[10px] font-bold text-primary">{num}</span>
        </sup>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function ResearchSourcesCard({ analysis }: { analysis: AnalysisDto }) {
  const sources = analysis.researchSources || [];
  if (!analysis.researchContent && sources.length === 0) return null;

  const latency = analysis.researchLatencyMs ? `${(analysis.researchLatencyMs / 1000).toFixed(1)} dtk` : null;
  const content = analysis.researchContent || "";

  return (
    <Card className="mt-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              Sumber riset hukum
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Konteks peraturan hukum Indonesia yang diidentifikasi oleh sistem AI.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {analysis.researchEffort && (
              <span className="rounded-full border bg-background px-2.5 py-1 font-medium">
                effort: {analysis.researchEffort}
              </span>
            )}
            {latency && (
              <span className="rounded-full border bg-background px-2.5 py-1 font-medium">
                riset: {latency}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sources.length > 0 && (
          <div className="grid gap-2">
            {sources.map((source, index) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border bg-background p-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{source.title}</span>
                  <span className="mt-0.5 block break-all text-xs text-muted-foreground">{source.url}</span>
                </span>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </a>
            ))}
          </div>
        )}

        {content && (
          <div className="rounded-lg border bg-background px-4 pb-4 pt-3">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Quote className="h-3.5 w-3.5" /> Ringkasan Riset Hukum
            </p>
            <div>
              <RenderMarkdown text={content} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card className="overflow-hidden transition-shadow hover:shadow-md" id={`finding-item-${finding.id}`}>
      <AccordionItem value={finding.id} className="border-b-0">
        <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
          <div className="flex w-full items-start gap-3 pr-2 text-left">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-base">{meta.emoji}</span>
                <span className="font-semibold text-ink">{finding.categoryLabel}</span>
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
            <div className="rounded-lg border border-emerald-300/40 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <Languages className="h-3.5 w-3.5" /> Bahasa awam
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{finding.plainTranslation}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-300/40 bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" /> Mengapa ini berisiko
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{finding.explanation}</p>
          </div>

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
