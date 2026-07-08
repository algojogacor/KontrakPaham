"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
import { Eye, EyeOff, Loader2, KeyRound, Trash2, ShieldAlert, User as UserIcon, Calendar, BadgeCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function SettingsView() {
  const { user, setView, setAuth } = useApp();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (!user) return null;

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.changePassword(currentPw, newPw);
      toast({ title: "Password berhasil diubah." });
      setCurrentPw("");
      setNewPw("");
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== user.username) {
      toast({ title: "Ketik username Anda persis untuk konfirmasi.", variant: "destructive" });
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount();
      setAuth(null, null);
      setView("home");
      toast({ title: "Akun & seluruh data Anda telah dihapus." });
    } catch (e) {
      toast({ title: friendlyError(e), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
      <p className="mt-1 text-sm text-muted-foreground">Kelola profil, keamanan, dan data Anda.</p>

      {/* Profile */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><UserIcon className="h-5 w-5 text-primary" /> Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Username" value={user.username} />
          <Row label="Email" value={user.email} />
          {user.displayName && <Row label="Nama tampilan" value={user.displayName} />}
          <Row label="Paket" value={<span className="inline-flex items-center gap-1 font-semibold uppercase text-primary"><BadgeCheck className="h-4 w-4" /> {user.plan}</span>} />
          <Row label="Bergabung" value={<span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(user.createdAt), "d MMMM yyyy", { locale: idLocale })}</span>} />
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5 text-primary" /> Ganti Password</CardTitle>
          <CardDescription>Pakai password yang kuat & unik (min. 8 karakter, ada huruf & angka).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePw} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur">Password lama</Label>
              <div className="relative">
                <Input id="cur" type={showCur ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" />
                <button type="button" onClick={() => setShowCur((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                  {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">Password baru</Label>
              <div className="relative">
                <Input id="new" type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} autoComplete="new-password" />
                <button type="button" onClick={() => setShowNew((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Tidak boleh sama dengan password lama.</p>
            </div>
            <Button type="submit" disabled={loading || newPw.length < 8 || !currentPw}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ubah password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive"><ShieldAlert className="h-5 w-5" /> Zona Berbahaya</CardTitle>
          <CardDescription>Hapus akun & seluruh data secara permanen. Tidak bisa dibatalkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Hapus akun saya
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Yakin menghapus akun?</AlertDialogTitle>
                <AlertDialogDescription>
                  Seluruh data — profil, riwayat analisis, temuan, kuota — akan dihapus permanen.
                  Tindakan ini tidak bisa dibatalkan. Untuk konfirmasi, ketik username Anda: <strong>{user.username}</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={user.username} />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAccount}
                  disabled={deleting || deleteConfirm !== user.username}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Hapus permanen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              Sesuai prinsip kepemilikan data, Anda berhak menghapus data Anda sendiri kapan saja.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
