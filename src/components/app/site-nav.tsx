"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  BarChart3,
  BookOpen,
  FileSearch,
  FileText,
  HelpCircle,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ViewTarget = Parameters<ReturnType<typeof useApp>["setView"]>[0];

export function SiteNav() {
  const { user, view, setView, setAuth } = useApp();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    try {
      await api.signout();
    } catch {
      /* ignore */
    }
    setAuth(null, null);
    setView("home");
    setOpen(false);
    toast({ title: "Anda telah keluar." });
  };

  const navItem = (label: string, target: ViewTarget, Icon: LucideIcon, hint: string) => (
    <button
      key={`${label}-${target}`}
      onClick={() => {
        setView(target);
        setOpen(false);
      }}
      className={cn("menu-drawer-item group", view === target ? "is-active" : "")}
    >
      <span className="menu-drawer-item__icon"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
      </span>
    </button>
  );

  const primaryItems: Array<[string, ViewTarget, LucideIcon, string]> = user
    ? [
        ["Dashboard", "dashboard", LayoutDashboard, "Ringkasan akun dan kuota"],
        ["Analisis", "analyze", FileSearch, "Unggah kontrak baru"],
        ["Contoh", "samples", FileText, "Coba tanpa dokumen"],
        ["Insight", "insights", BarChart3, "Pola risiko kontrak"],
        ["Riwayat", "history", History, "Hasil yang tersimpan"],
      ]
    : [
        ["Beranda", "home", Home, "Lihat cara kerja"],
        ["Contoh", "samples", FileText, "Coba tanpa dokumen"],
        ["Harga", "pricing", Sparkles, "Paket dan batasan"],
      ];

  const secondaryItems: Array<[string, ViewTarget, LucideIcon, string]> = user
    ? [
        ["FAQ", "faq", HelpCircle, "Pertanyaan umum"],
        ["Glosarium", "glossary", BookOpen, "Istilah hukum awam"],
        ["Harga", "pricing", Sparkles, "Paket dan batasan"],
        ["Konsultasi", "consultation", Sparkles, "Bantuan lanjutan"],
        ["Pengaturan", "settings", Settings, "Akun dan keamanan"],
        ...(user.plan === "ADMIN"
          ? ([["Admin", "admin", ShieldCheck, "Panel operasional"]] as Array<[string, ViewTarget, LucideIcon, string]>)
          : []),
      ]
    : [
        ["FAQ", "faq", HelpCircle, "Pertanyaan umum"],
        ["Glosarium", "glossary", BookOpen, "Istilah hukum awam"],
        ["Konsultasi", "consultation", Sparkles, "Bantuan lanjutan"],
      ];

  return (
    <header className="sticky top-0 z-40 w-full px-3 py-2">
      <div className="glass mx-auto flex h-16 max-w-6xl items-center justify-between rounded-[1.35rem] border-border/70 px-3 shadow-soft sm:px-4">
        <button onClick={() => setView(user ? "dashboard" : "home")} className="nav-brand group flex items-center gap-2.5">
          <div className="nav-brand__mark relative flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-background shadow-soft">
            <span className="font-display text-lg font-bold leading-none">K</span>
            <span className="absolute -bottom-0.5 left-1.5 right-1.5 h-0.5 rounded-full bg-amber-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold tracking-tight text-ink">
              Kontrak<span className="text-primary">Paham</span>
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Baca sebelum tanda tangan</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {user && (
            <Avatar className="h-9 w-9 border border-border bg-primary/10">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {(user.displayName || user.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="nav-menu-trigger h-10 gap-2 rounded-full px-3" aria-label="Buka menu">
                <Menu className="h-5 w-5" />
                <span className="hidden text-sm sm:inline">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="menu-drawer w-[min(430px,100vw)] overflow-y-auto p-0">
              <SheetHeader className="menu-drawer-header border-b border-border px-5 py-5 pr-12">
                <div>
                  <SheetTitle className="text-left font-display text-2xl text-ink">Menu</SheetTitle>
                  <p className="mt-1 text-left text-sm text-muted-foreground">
                    {user ? "Pilih ruang kerja Anda." : "Mulai dari contoh atau daftar gratis."}
                  </p>
                </div>
              </SheetHeader>

              <div className="px-5 py-5">
                {user && (
                  <div className="mb-5 rounded-2xl border border-border bg-muted/45 p-4">
                    <p className="font-display text-lg font-semibold text-ink">{user.displayName || user.username}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
                    <span className="mt-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                      {user.plan}
                    </span>
                  </div>
                )}

                <MenuSection label={user ? "Ruang kerja" : "Mulai"}>
                  {primaryItems.map(([label, target, icon, hint]) => navItem(label, target, icon, hint))}
                </MenuSection>

                <MenuSection label="Bantuan" className="mt-5">
                  {secondaryItems.map(([label, target, icon, hint]) => navItem(label, target, icon, hint))}
                </MenuSection>

                {!user && (
                  <div className="menu-drawer-actions mt-5 grid gap-2 border-t border-border pt-5">
                    <Button variant="outline" onClick={() => { setView("signin"); setOpen(false); }} className="h-12 rounded-2xl">
                      Masuk
                    </Button>
                    <Button onClick={() => { setView("signup"); setOpen(false); }} className="h-12 rounded-2xl">
                      Daftar Gratis
                    </Button>
                  </div>
                )}

                {user && (
                  <div className="menu-drawer-actions mt-5 border-t border-border pt-5">
                    <Button variant="outline" onClick={logout} className="h-12 w-full justify-start gap-2 rounded-2xl">
                      <LogOut className="h-4 w-4" /> Keluar
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MenuSection({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={className}>
      <p className="mb-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}
