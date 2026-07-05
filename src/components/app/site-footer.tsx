"use client";

import { useApp } from "@/lib/store";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteFooter() {
  const setView = useApp((s) => s.setView);
  const user = useApp((s) => s.user);
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight">KontrakPaham</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bantu orang awam memahami kontrak sebelum tanda tangan. Edukasi, bukan nasihat hukum definitif.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Produk</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => setView(user ? "analyze" : "home")} className="hover:text-foreground">Analisis Kontrak</button></li>
              <li><button onClick={() => setView("pricing")} className="hover:text-foreground">Harga & Paket</button></li>
              <li><button onClick={() => setView("consultation")} className="hover:text-foreground">Konsultasi Lanjutan</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Akun</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => setView(user ? "history" : "signin")} className="hover:text-foreground">Riwayat Analisis</button></li>
              <li><button onClick={() => setView(user ? "settings" : "signin")} className="hover:text-foreground">Pengaturan Akun</button></li>
              <li><button onClick={() => setView(user ? "dashboard" : "signup")} className="hover:text-foreground">{user ? "Dashboard" : "Daftar"}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Kontak</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://wa.me/628999021644" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">WhatsApp: 08999021644</a></li>
              <li><a href="https://instagram.com/aryarizky04" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">IG: @aryarizky04</a></li>
              <li><a href="mailto:aryarizkyardhipratama@gmail.com" className="hover:text-foreground">Email</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} KontrakPaham. Dikelola oleh mahasiswa hukum tingkat akhir, bukan advokat berlisensi.
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Tema:</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
