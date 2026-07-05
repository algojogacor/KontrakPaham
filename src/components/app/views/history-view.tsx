"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { RiskPill } from "@/components/app/badges";
import { EmptyState } from "@/components/app/empty-state";
import { FileText, FileSearch, Search, Download, Trash2, Plus, Clock, Loader2, History as HistoryIcon } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (id: string) => {
    toast({ title: "Memuat…" });
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <HistoryIcon className="h-6 w-6 text-primary" /> Riwayat Analisis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua analisis tersimpan di akun Anda. Klik untuk melihat detail atau mengunduh ulang.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setView("analyze")}>
          <Plus className="h-4 w-4" /> Analisis Baru
        </Button>
      </div>

      {items && items.length > 0 && (
        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul atau nama file…"
            className="pl-9"
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-5 space-y-3">
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
          <EmptyState
            icon={FileSearch}
            title="Belum ada analisis"
            desc="Mulai analisis kontrak pertama Anda — unggah PDF/DOCX atau tempel teks."
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
            <Card key={a.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <button onClick={() => open(a.id)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
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
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {a.summary || (a.status === "FAILED" ? "Analisis gagal" : "—")}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: idLocale })}
                      </span>
                      <span>· {format(new Date(a.createdAt), "d MMM yyyy", { locale: idLocale })}</span>
                      <span>· {a.findingsCount} temuan</span>
                      <span>· {a.charCount.toLocaleString("id-ID")} karakter</span>
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
              Tindakan ini permanen. Analisis & seluruh temuan akan dihapus selamanya.
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
    </div>
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
