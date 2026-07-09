"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Clock,
  Download,
  FileSearch,
  FileText,
  History as HistoryIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskPill } from "@/components/app/badges";
import { EmptyState } from "@/components/app/empty-state";
import { MascotEmptyState } from "@/components/app/mascot-system";
import { ViewShell } from "@/components/app/view-shell";
import { api, friendlyError } from "@/lib/api-client";
import { useApp } from "@/lib/store";
import type { AnalysisDto } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

type HistoryItem = AnalysisDto & { findingsCount: number };

export function HistoryView() {
  const { setView, setCurrentAnalysis, setQuota } = useApp();
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listAnalyses();
      setItems(data.analyses);
      setQuota(data.quota);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const open = async (id: string) => {
    toast({ title: "Memuat..." });
    try {
      const { analysis } = await api.getAnalysis(id);
      setCurrentAnalysis(analysis);
      setView("result");
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteAnalysis(deleteId);
      setItems((prev) => prev?.filter((x) => x.id !== deleteId) || null);
      toast({ title: "Analisis dihapus." });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const filtered = items?.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      (a.fileName || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ViewShell
      size="medium"
      eyebrow="Arsip kontrak"
      title="Riwayat Analisis"
      description="Semua analisis tersimpan di akun Anda. Klik kartu untuk melihat detail atau unduh ulang laporan PDF."
      icon={HistoryIcon}
      actions={
        <Button className="gap-1.5" onClick={() => setView("analyze")}>
          <Plus className="h-4 w-4" /> Analisis Baru
        </Button>
      }
    >
      {items && items.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul atau nama file..."
            className="h-11 rounded-xl bg-card pl-9"
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : !items || items.length === 0 ? (
          <MascotEmptyState
            title="Belum ada analisis"
            description="Mulai analisis kontrak pertama Anda: unggah PDF/DOCX atau tempel teks."
            action={<Button onClick={() => setView("analyze")} className="gap-1.5"><Plus className="h-4 w-4" /> Analisis sekarang</Button>}
          />
        ) : filtered?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk "{query}".
            </CardContent>
          </Card>
        ) : (
          filtered?.map((a) => (
            <Card key={a.id} className="border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
              <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <button onClick={() => open(a.id)} className="grid min-w-0 gap-3 text-left sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
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
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {a.summary || (a.status === "FAILED" ? "Analisis gagal" : "-")}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: idLocale })}
                      </span>
                      <span>- {format(new Date(a.createdAt), "d MMM yyyy", { locale: idLocale })}</span>
                      <span>- {a.findingsCount} temuan</span>
                      <span>- {a.charCount.toLocaleString("id-ID")} karakter</span>
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                  <div className="sm:mr-2">
                    {a.status === "COMPLETED" && a.overallRisk ? (
                      <RiskPill risk={a.overallRisk} size="sm" />
                    ) : a.status === "FAILED" ? (
                      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Gagal</span>
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {a.status === "COMPLETED" && (
                    <Button variant="ghost" size="icon" aria-label="Unduh PDF" onClick={() => { void downloadPdf(a); }}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Hapus" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus analisis ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini permanen. Analisis dan seluruh temuan akan dihapus selamanya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Hapus permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ViewShell>
  );
}

async function downloadPdf(a: HistoryItem) {
  try {
    const res = await fetch(api.exportUrl(a.id));
    if (!res.ok) throw new Error("Gagal membuat PDF.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KontrakPaham-${a.title.slice(0, 40).replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: "PDF terunduh." });
  } catch (e) {
    toast({ title: friendlyError(e), variant: "destructive" });
  }
}
