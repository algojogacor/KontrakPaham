"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, Printer, CheckCircle2, Circle, AlertTriangle, ShieldCheck,
  FileText, Lightbulb, Download,
} from "lucide-react";
import type { FindingDto } from "@/lib/types";

export function ChecklistView() {
  const { currentAnalysis, setView, user } = useApp();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const items = useMemo(() => {
    if (!currentAnalysis) return [];
    // Only include SEDANG/TINGGI/KRITIS findings (actionable ones)
    return currentAnalysis.findings
      .filter((f) => f.severity !== "RENDAH")
      .sort((a, b) => {
        const order: Record<string, number> = { KRITIS: 0, TINGGI: 1, SEDANG: 2 };
        return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
      });
  }, [currentAnalysis]);

  if (!currentAnalysis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Tidak ada analisis untuk dibuat checklist.</p>
        <Button className="mt-4" onClick={() => setView("history")}>Lihat riwayat</Button>
      </div>
    );
  }

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const doneCount = items.filter((i) => checked.has(i.id)).length;
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView("result")}>
          <ArrowLeft className="h-4 w-4" /> Kembali ke hasil
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Cetak / Simpan PDF
        </Button>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block mb-6">
        <h1 className="font-display text-2xl font-bold">Checklist Sebelum Tanda Tangan</h1>
        <p className="text-sm text-gray-600">KontrakPaham · {currentAnalysis.title}</p>
        <p className="text-xs text-gray-500">Dibuat: {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Checklist Sebelum Tanda Tangan
            </h1>
            <p className="text-sm text-muted-foreground">
              Tandai setiap klausul berisiko yang sudah Anda klarifikasi/negosiasi.
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mt-5 print:hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Progres klarifikasi</span>
              <span className="font-display text-2xl font-bold tabular-nums text-primary">{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {doneCount} dari {items.length} klausul berisiko sudah ditangani.
            </p>
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <Card className="mt-5 border-dashed">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="mt-3 font-medium">Tidak ada klausul berisiko signifikan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Semua temuan berlabel RENDAH. Kontrak relatif aman, tapi tetap baca dengan teliti.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((f, idx) => (
              <ChecklistItem
                key={f.id}
                finding={f}
                index={idx}
                checked={checked.has(f.id)}
                onToggle={() => toggle(f.id)}
              />
            ))}
          </div>
        )}

        {progress === 100 && (
          <Alert className="mt-5 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-800 dark:text-emerald-200">Semua klausul sudah Anda tangani!</AlertTitle>
            <AlertDescription className="text-emerald-700 dark:text-emerald-300">
              Anda sudah mengklarifikasi/menegositasi semua klausul berisiko. Pastikan hasil
              negosiasi tertulis di kontrak final sebelum tanda tangan.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mt-6 print:hidden">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Checklist ini dibuat dari hasil analisis AI yang bersifat edukasi. Tidak menggantikan
            nasihat advokat berlisensi. Untuk kontrak bernilai besar, konsultasi profesional.
          </AlertDescription>
        </Alert>

        <div className="mt-6 flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setView("result")}>
            <FileText className="h-4 w-4" /> Lihat hasil lengkap
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Download className="h-4 w-4" /> Simpan sebagai PDF
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setView("consultation")}>
            <Lightbulb className="h-4 w-4" /> Konsultasi lanjutan
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({
  finding,
  index,
  checked,
  onToggle,
}: {
  finding: FindingDto;
  index: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const sevColor: Record<string, string> = {
    KRITIS: "border-red-500/40 bg-red-50/40 dark:bg-red-950/10",
    TINGGI: "border-orange-500/40 bg-orange-50/40 dark:bg-orange-950/10",
    SEDANG: "border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/10",
  };
  return (
    <Card
      className={`transition-all ${checked ? "opacity-60" : ""} ${sevColor[finding.severity] || ""}`}
    >
      <CardContent className="p-4">
        <button onClick={onToggle} className="flex w-full items-start gap-3 text-left">
          <span className="mt-0.5 shrink-0">
            {checked ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/50" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-xs font-bold text-muted-foreground">#{index + 1}</span>
              <span className="font-semibold text-ink">{finding.categoryLabel}</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  finding.severity === "KRITIS"
                    ? "border-red-500/40 text-red-700 dark:text-red-300"
                    : finding.severity === "TINGGI"
                      ? "border-orange-500/40 text-orange-700 dark:text-orange-300"
                      : "border-amber-500/40 text-amber-700 dark:text-amber-300"
                }`}
              >
                {finding.severity}
              </Badge>
            </div>
            <p className={`mt-1.5 text-sm leading-relaxed ${checked ? "line-through text-muted-foreground" : "text-ink"}`}>
              {finding.plainTranslation}
            </p>
            <div className="mt-2 rounded-md bg-background/60 p-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Saran tindakan</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{finding.recommendation}</p>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
