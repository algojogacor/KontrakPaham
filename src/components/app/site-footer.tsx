"use client";

import { useApp } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteFooter() {
  const setView = useApp((s) => s.setView);
  const setLegalDocSlug = useApp((s) => s.setLegalDocSlug);
  const user = useApp((s) => s.user);
  const headingClass = "mb-3 font-display text-xs font-semibold uppercase tracking-[0.15em] text-background/50 dark:text-foreground/45";
  const linkClass = "inline-flex max-w-full text-left leading-relaxed text-background/70 transition-colors hover:text-amber-400 dark:text-foreground/70 dark:hover:text-primary";

  const openLegal = (slug: string) => {
    setLegalDocSlug(slug);
    setView("legal");
  };

  return (
    <footer className="mt-auto border-t border-border bg-ink text-background/80 dark:bg-[oklch(0.12_0.012_55)] dark:text-foreground/75">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.35fr_1.1fr]">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-background/10 text-background dark:bg-foreground/10 dark:text-foreground">
                <span className="font-display text-lg font-bold leading-none">K</span>
                <span className="absolute -bottom-0.5 left-1.5 right-1.5 h-0.5 rounded-full bg-amber-400" />
              </div>
              <span className="font-display text-base font-semibold tracking-tight text-background dark:text-foreground">
                Kontrak<span className="text-amber-400">Paham</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-background/60 dark:text-foreground/60">
              Bantu orang awam memahami kontrak sebelum tanda tangan. Edukasi, bukan nasihat hukum definitif.
            </p>
            <p className="text-xs text-background/40 dark:text-foreground/45">
              Dikelola oleh mahasiswa hukum UNAIR, bukan advokat berlisensi.
            </p>
          </div>

          <div>
            <h4 className={headingClass}>Produk</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView(user ? "analyze" : "home")} className={linkClass}>Analisis Kontrak</button></li>
              <li><button onClick={() => setView("samples")} className={linkClass}>Contoh Kontrak</button></li>
              <li><button onClick={() => setView(user ? "insights" : "signup")} className={linkClass}>Insight & Statistik</button></li>
              <li><button onClick={() => setView("pricing")} className={linkClass}>Harga & Paket</button></li>
              <li><button onClick={() => setView("consultation")} className={linkClass}>Konsultasi</button></li>
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>Belajar</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setView("faq")} className={linkClass}>FAQ</button></li>
              <li><button onClick={() => setView("glossary")} className={linkClass}>Glosarium Hukum</button></li>
              <li><button onClick={() => setView("home")} className={linkClass}>Cara Kerja</button></li>
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => openLegal("terms")} className={linkClass}>Syarat & Ketentuan</button></li>
              <li><button onClick={() => openLegal("privacy")} className={linkClass}>Kebijakan Privasi</button></li>
              <li><button onClick={() => openLegal("disclaimer")} className={linkClass}>Disclaimer Hukum</button></li>
              <li><button onClick={() => openLegal("liability")} className={linkClass}>Batasan Tanggung Jawab</button></li>
              <li><button onClick={() => openLegal("content-policy")} className={linkClass}>Kebijakan Konten</button></li>
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>Kontak</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://wa.me/628999021644" target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp / 08999021644</a></li>
              <li><a href="https://instagram.com/aryarizky04" target="_blank" rel="noopener noreferrer" className={linkClass}>IG / @aryarizky04</a></li>
              <li><a href="mailto:aryarizkyardhipratama@gmail.com" className={linkClass}>Email</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-background/10 pt-6 text-xs text-background/40 dark:border-foreground/10 dark:text-foreground/45 sm:flex-row sm:items-center">
          <p>(c) {new Date().getFullYear()} KontrakPaham / Made with care in Indonesia.</p>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
