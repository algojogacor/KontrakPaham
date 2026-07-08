"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  CheckCircle2,
  Mail,
  MessageSquare,
  FileText,
  Loader2,
  Info,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function NegotiationView() {
  const { currentAnalysis, setView } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tone, setTone] = useState<"professional" | "assertive" | "friendly">("professional");
  const [channel, setChannel] = useState<"email" | "whatsapp" | "letter">("email");
  const [customRequest, setCustomRequest] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const items = useMemo(() => {
    if (!currentAnalysis) return [];
    // Sort critical and high first, since they are the ones usually needing negotiation
    return [...currentAnalysis.findings].sort((a, b) => {
      const order: Record<string, number> = { KRITIS: 0, TINGGI: 1, SEDANG: 2, RENDAH: 3 };
      return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
    });
  }, [currentAnalysis]);

  // Auto-select critical and high severity findings initially
  useMemo(() => {
    const initial = new Set<string>();
    items.forEach((item) => {
      if (item.severity === "KRITIS" || item.severity === "TINGGI" || item.severity === "SEDANG") {
        initial.add(item.id);
      }
    });
    setSelectedIds(initial);
  }, [items]);

  if (!currentAnalysis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Tidak ada analisis untuk dibuat proposal negosiasi.</p>
        <Button className="mt-4" onClick={() => setView("history")}>Lihat riwayat</Button>
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "Pilih klausul dulu", description: "Pilih minimal satu klausul yang ingin dinegosiasikan.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    toast({ title: "Menyusun draf negosiasi...", description: "AI sedang menganalisis alternatif terbaik." });
    try {
      const res = await api.generateNegotiationDraft(currentAnalysis.id, {
        findingIds: Array.from(selectedIds),
        tone,
        channel,
        customRequest: customRequest.trim() || undefined,
      });
      setDraftResult(res.draft);
      toast({ title: "Draf berhasil dibuat!", description: "Silakan periksa dan sesuaikan." });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!draftResult) return;
    try {
      await navigator.clipboard.writeText(draftResult);
      setCopied(true);
      toast({ title: "Draf disalin ke clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Gagal menyalin.", variant: "destructive" });
    }
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView("result")}>
          <ArrowLeft className="h-4 w-4" /> Kembali ke hasil
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Asisten Draf Negosiasi Kontrak
          </h1>
          <p className="text-sm text-muted-foreground">
            Susun draf pesan profesional untuk menegosiasikan klausul kontrak yang berisiko.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Left Column: Configuration Form */}
        <div className="space-y-6">
          {/* Finding selector */}
          <Card className="border-border/70 shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">1. Pilih Klausul Bermasalah</CardTitle>
                  <CardDescription>Pilih klausul mana yang ingin Anda usulkan perubahannya.</CardDescription>
                </div>
                <div className="flex gap-1.5 text-xs">
                  <button onClick={selectAll} className="text-primary hover:underline font-medium">Semua</button>
                  <span className="text-muted-foreground">|</span>
                  <button onClick={selectNone} className="text-primary hover:underline font-medium">Kosongkan</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[380px] overflow-y-auto space-y-2.5 pr-2 scroll-area">
              {items.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada temuan klausul.</p>
              ) : (
                items.map((f) => {
                  const isSelected = selectedIds.has(f.id);
                  const sevBorder = f.severity === "KRITIS"
                    ? "border-red-500/20"
                    : f.severity === "TINGGI"
                    ? "border-orange-500/20"
                    : f.severity === "SEDANG"
                    ? "border-amber-500/20"
                    : "border-border/50";
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleSelect(f.id)}
                      className={`cursor-pointer rounded-lg border p-3 text-sm transition-all hover:bg-muted/50 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : `bg-background ${sevBorder}`
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent click
                          className="mt-1 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground truncate">{f.categoryLabel}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${
                                f.severity === "KRITIS"
                                  ? "border-red-500/40 text-red-700 bg-red-50/50"
                                  : f.severity === "TINGGI"
                                  ? "border-orange-500/40 text-orange-700 bg-orange-50/50"
                                  : f.severity === "SEDANG"
                                  ? "border-amber-500/40 text-amber-700 bg-amber-50/50"
                                  : "border-emerald-500/40 text-emerald-700 bg-emerald-50/50"
                              }`}
                            >
                              {f.severity}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-normal">
                            {f.plainTranslation}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Tone & Channel Selector */}
          <Card className="border-border/70 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">2. Pilihan Saluran & Gaya Bahasa</CardTitle>
              <CardDescription>Sesuaikan draf pesan sesuai media dan hubungan Anda dengan mitra.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Communication Channel */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saluran Kirim</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { id: "email", label: "Email", icon: Mail },
                    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                    { id: "letter", label: "Surat Resmi", icon: FileText },
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const active = channel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setChannel(ch.id as any)}
                        className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all ${
                          active
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span className="mt-1.5 text-xs font-medium">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gaya Bahasa (Tone)</label>
                <div className="mt-2 space-y-2">
                  {[
                    { id: "professional", label: "Sopan & Profesional", desc: "Bahasa baku, diplomatis, menggunakan saya/Anda" },
                    { id: "assertive", label: "Tegas & Legal formal", desc: "Menitikberatkan pada asas keadilan & aturan hukum" },
                    { id: "friendly", label: "Kasual & Kekeluargaan", desc: "Lebih santai, persuasif, menjaga relasi erat" },
                  ].map((tn) => {
                    const active = tone === tn.id;
                    return (
                      <button
                        key={tn.id}
                        onClick={() => setTone(tn.id as any)}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-primary text-primary" : "border-muted-foreground/30"}`}>
                          {active && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{tn.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{tn.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom instructions */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catatan Tambahan (Opsional)</label>
                <Textarea
                  placeholder="Contoh: 'Tolong jelaskan bahwa saya tidak masalah masa percobaan diganti menjadi 3 bulan asal denda resign dihapus.'"
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  className="mt-2 text-xs leading-normal resize-none h-20"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={generating || selectedIds.size === 0}
            className="w-full h-11 text-sm font-semibold gap-2 shadow-soft"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyusun draf...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Susun Draf Negosiasi
              </>
            )}
          </Button>
        </div>

        {/* Right Column: AI output draft workspace */}
        <div>
          <Card className="h-full flex flex-col border-border/70 shadow-soft bg-card/60 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Draf Negosiasi Anda</CardTitle>
                  <CardDescription>Hasil draf negosiasi siap salin dan kirim.</CardDescription>
                </div>
                {draftResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs font-medium"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Salin Draf
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-[400px]">
              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="mt-4 font-semibold text-ink text-sm">Menyusun draf pesan terbaik...</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[240px]">
                    Kami merangkum argumen kesetaraan hukum dan alternatif terbaik untuk Anda.
                  </p>
                </div>
              ) : draftResult ? (
                <div className="flex-1 flex flex-col p-4">
                  <div className="flex-1 overflow-auto rounded-lg border bg-background p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground select-text max-h-[500px]">
                    {draftResult}
                  </div>
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20 flex gap-2.5 items-start">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      <strong className="text-foreground">Penting:</strong> Harap baca kembali draf ini dan ganti penanda berbracket seperti <code className="bg-muted px-1 rounded">[Nama Anda]</code> sebelum mengirimkannya ke mitra Anda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-semibold text-ink text-sm">Belum ada draf</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
                    Pilih klausul di sebelah kiri, pilih gaya bahasa, lalu klik tombol "Susun Draf Negosiasi" untuk memulai.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 justify-center sm:flex-row items-center border-t pt-5">
        <Alert className="max-w-2xl border-dashed">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertTitle className="text-xs font-bold text-ink">Keamanan & Keabsahan</AlertTitle>
          <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            Draf ini dibuat berdasarkan asas kesetaraan berkontrak di Indonesia. Negosiasi yang sehat mengurangi risiko hukum di kemudian hari. Pastikan perubahan yang disepakati dituangkan dalam dokumen kontrak bertanda tangan basah/digital yang sah.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
