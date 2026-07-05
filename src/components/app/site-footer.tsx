"use client";

import { useApp } from "@/lib/store";
import { CompanionLogo } from "@/components/app/custom-svg";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteFooter() {
  const setView = useApp((s) => s.setView);
  const user = useApp((s) => s.user);
  return (
    <footer className="mt-auto border-t border-border bg-ink text-background/70">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/10">
                <CompanionLogo size={26} className="text-primary" />
              </div>
              <span className="font-display text-base font-semibold tracking-tight text-background">
                Kontrak<span className="text-primary">Paham</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-background/50">
              Teman yang bantu baca kontrak sebelum tanda tangan. Edukasi, bukan nasihat hukum definitif.
            </p>
            <p className="text-xs text-background/40">
              Dikelola oleh mahasiswa hukum tingkat akhir, bukan advokat berlisensi.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-background/40">Produk</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView(user ? "analyze" : "home")} className="text-background/60 transition-colors hover:text-primary">Baca Kontrak</button></li>
              <li><button onClick={() => setView("samples")} className="text-background/60 transition-colors hover:text-primary">Contoh Kontrak</button></li>
              <li><button onClick={() => setView(user ? "insights" : "signup")} className="text-background/60 transition-colors hover:text-primary">Insight</button></li>
              <li><button onClick={() => setView("pricing")} className="text-background/60 transition-colors hover:text-primary">Harga</button></li>
              <li><button onClick={() => setView("consultation")} className="text-background/60 transition-colors hover:text-primary">Konsultasi</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-background/40">Belajar</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView("faq")} className="text-background/60 transition-colors hover:text-primary">FAQ</button></li>
              <li><button onClick={() => setView("glossary")} className="text-background/60 transition-colors hover:text-primary">Glosarium</button></li>
              <li><button onClick={() => setView("home")} className="text-background/60 transition-colors hover:text-primary">Cara Kerja</button></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-background/40">Kontak</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://wa.me/628999021644" target="_blank" rel="noopener noreferrer" className="text-background/60 transition-colors hover:text-primary">WA · 08999021644</a></li>
              <li><a href="https://instagram.com/aryarizky04" target="_blank" rel="noopener noreferrer" className="text-background/60 transition-colors hover:text-primary">IG · @aryarizky04</a></li>
              <li><a href="mailto:aryarizkyardhipratama@gmail.com" className="text-background/60 transition-colors hover:text-primary">Email</a></li>
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
