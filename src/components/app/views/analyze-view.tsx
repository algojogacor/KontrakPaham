"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, ClipboardPaste, Loader2, AlertTriangle, FileCheck2, ScanLine, Sparkles, X, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ANALYSIS_STEPS = [
  { label: "Membaca dokumen", detail: "Mengekstrak teks dari file Anda" },
  { label: "Memvalidasi", detail: "Cek bahasa, kelengkapan, & ukuran" },
  { label: "Menganalisis klausul", detail: "Mendeteksi klausul berisiko per kategori" },
  { label: "Menyusun penjelasan", detail: "Menerjemahkan ke bahasa awam" },
  { label: "Menyusun rekomendasi", detail: "Memberi saran tindakan konkret" },
];

export function AnalyzeView() {
  const { setView, setCurrentAnalysis, setQuota, user } = useApp();
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear any pending progress timers on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const charLimit = 50000;
  const charsLeft = charLimit - text.length;

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    const ext = f.name.toLowerCase().split(".").pop() || "";
    if (ext !== "pdf" && ext !== "docx") {
      setError("Format file tidak didukung. Hanya PDF atau DOCX.");
      setFile(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError(`Ukuran file ${f.name} melebihi 5 MB (paket ${user?.plan || "FREE"}).`);
      setFile(null);
      return;
    }
    setError("");
    setFile(f);
    setTab("file");
  }, [user?.plan]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    onFile(f);
  };

  const startProgress = () => {
    setStepIdx(0);
    // Clear any previous timers before starting new ones
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const delay = (i: number, ms: number) =>
      timersRef.current.push(setTimeout(() => setStepIdx(i), ms));
    delay(1, 1200);
    delay(2, 2800);
    delay(3, 6000);
    delay(4, 9000);
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  };

  const run = async () => {
    setError("");
    setWarnings([]);
    if (tab === "text" && text.trim().length < 120) {
      setError("Teks kontrak terlalu pendek. Pastikan Anda menyalin kontrak lengkap (min. 120 karakter).");
      return;
    }
    if (tab === "file" && !file) {
      setError("Pilih file PDF atau DOCX dulu.");
      return;
    }
    setLoading(true);
    const cancelProgress = startProgress();
    try {
      const res =
        tab === "text"
          ? await api.analyzeText(text)
          : await api.analyzeFile(file!);
      setWarnings(res.warnings || []);
      setCurrentAnalysis(res.analysis);
      // Refresh quota
      try {
        const q = await api.getQuota();
        setQuota(q.quota);
      } catch {
        /* ignore */
      }
      setView("result");
      toast({ title: "Analisis selesai!", description: `${res.analysis.findings.length} temuan ditemukan.` });
    } catch (e) {
      setError(friendlyError(e));
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      cancelProgress();
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Analisis Kontrak</h1>
        <p className="mt-1 text-muted-foreground">
          Unggah file atau tempel teks kontrak berbahasa Indonesia. Hasil muncul dalam ~1 menit.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="mt-6 border-amber-300/60 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Catatan dokumen</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <LoadingCard stepIdx={stepIdx} />
      ) : (
        <Card className="mt-6">
          <CardContent className="p-5 sm:p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="gap-1.5">
                  <ClipboardPaste className="h-4 w-4" /> Tempel Teks
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-1.5">
                  <Upload className="h-4 w-4" /> Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4 space-y-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tempel teks kontrak di sini… (min. 120 karakter, maks. 50.000)"
                  className="min-h-[260px] resize-y font-mono text-sm leading-relaxed"
                  maxLength={charLimit + 1000}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{text.length.toLocaleString("id-ID")} karakter</span>
                  <span className={charsLeft < 0 ? "text-destructive" : ""}>{charsLeft.toLocaleString("id-ID")} karakter tersisa</span>
                </div>
              </TabsContent>

              <TabsContent value="file" className="mt-4">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] || null)}
                />
                {!file ? (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-medium">Klik untuk memilih, atau seret file ke sini</p>
                      <p className="mt-1 text-xs text-muted-foreground">PDF (termasuk scan — ada OCR) atau DOCX · maks. 5 MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background">
                      <FileCheck2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB · {file.name.split(".").pop()?.toUpperCase()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Hapus file">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ScanLine className="h-3.5 w-3.5" /> PDF hasil scan? OCR otomatis diaktifkan jika teks tak terbaca.
              </p>
              <Button size="lg" className="gap-2" onClick={run} disabled={loading}>
                <Sparkles className="h-4 w-4" /> Mulai Analisis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy note */}
      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
        Teks kontrak Anda disimpan terkait akun untuk riwayat & bisa Anda hapus kapan saja. Jangan unggah dokumen
        yang mengandung data sensitif jika tidak perlu (mis. nomor KTP penuh). Sebaiknya sensor dulu.
      </p>
    </div>
  );
}

function LoadingCard({ stepIdx }: { stepIdx: number }) {
  return (
    <Card className="mt-6 overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Sedang menganalisis kontrak Anda…</h3>
            <p className="text-sm text-muted-foreground">Biasanya 30 detik – 2 menit. Jangan tutup halaman ini.</p>
          </div>
        </div>

        <div className="space-y-3">
          {ANALYSIS_STEPS.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {done ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : active ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Progress value={Math.min(100, ((stepIdx + 1) / ANALYSIS_STEPS.length) * 100)} className="mt-5 h-1.5" />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <FileText className="mr-1 inline h-3 w-3" />
          Tip: sambil menunggu, siapkan pertanyaan untuk klarifikasi ke pihak kontrak.
        </p>
      </CardContent>
    </Card>
  );
}
