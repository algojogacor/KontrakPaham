"use client";

import { useApp } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteFooter() {
  const setView = useApp((s) => s.setView);
  const user = useApp((s) => s.user);
  return (
    <footer className="mt-auto border-t border-border bg-ink text-background/80">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-background/10 text-background">
                <span className="font-display text-lg font-bold leading-none">K</span>
                <span className="absolute -bottom-0.5 left-1.5 right-1.5 h-0.5 rounded-full bg-amber-400" />
              </div>
              <span className="font-display text-base font-semibold tracking-tight text-background">
                Kontrak<span className="text-amber-400">Paham</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-background/60">
              Bantu orang awam memahami kontrak sebelum tanda tangan. Edukasi, bukan nasihat hukum definitif.
            </p>
            <p className="text-xs text-background/40">
              Dikelola oleh mahasiswa hukum tingkat akhir, bukan advokat berlisensi.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.15em] text-background/50">Produk</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView(user ? "analyze" : "home")} className="text-background/70 transition-colors hover:text-amber-400">Analisis Kontrak</button></li>
              <li><button onClick={() => setView("samples")} className="text-background/70 transition-colors hover:text-amber-400">Contoh Kontrak</button></li>
              <li><button onClick={() => setView(user ? "insights" : "signup")} className="text-background/70 transition-colors hover:text-amber-400">Insight & Statistik</button></li>
              <li><button onClick={() => setView("pricing")} className="text-background/70 transition-colors hover:text-amber-400">Harga & Paket</button></li>
              <li><button onClick={() => setView("consultation")} className="text-background/70 transition-colors hover:text-amber-400">Konsultasi</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.15em] text-background/50">Belajar</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView("faq")} className="text-background/70 transition-colors hover:text-amber-400">FAQ</button></li>
              <li><button onClick={() => setView("glossary")} className="text-background/70 transition-colors hover:text-amber-400">Glosarium Hukum</button></li>
              <li><button onClick={() => setView("home")} className="text-background/70 transition-colors hover:text-amber-400">Cara Kerja</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.15em] text-background/50">Kontak</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://wa.me/628999021644" target="_blank" rel="noopener noreferrer" className="text-background/70 transition-colors hover:text-amber-400">WhatsApp · 08999021644</a></li>
              <li><a href="https://instagram.com/aryarizky04" target="_blank" rel="noopener noreferrer" className="text-background/70 transition-colors hover:text-amber-400">IG · @aryarizky04</a></li>
              <li><a href="mailto:aryarizkyardhipratama@gmail.com" className="text-background/70 transition-colors hover:text-amber-400">Email</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-background/10 pt-6 text-xs text-background/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} KontrakPaham · Made with care in Indonesia.</p>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
