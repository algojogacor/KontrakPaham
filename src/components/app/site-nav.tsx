"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, LayoutDashboard, FileSearch, History, Settings, LogOut, Sparkles, HelpCircle, BookOpen, BarChart3, FileText, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    toast({ title: "Anda telah keluar." });
  };

  const navItem = (label: string, target: any, icon?: React.ReactNode) => (
    <button
      onClick={() => {
        setView(target);
        setOpen(false);
      }}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-muted hover:text-foreground",
        "after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:origin-left after:rounded-full after:bg-primary after:transition-transform",
        view === target ? "text-foreground after:scale-x-100" : "text-muted-foreground after:scale-x-0"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 w-full px-3 py-2">
      <div className="glass mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl border-border/70 px-3 shadow-soft sm:px-4">
        <button onClick={() => setView(user ? "dashboard" : "home")} className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          {/* Custom editorial logo mark — a stylized "K" with an annotation underline */}
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-background shadow-soft">
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {user ? (
            <>
              {navItem("Dashboard", "dashboard", <LayoutDashboard className="h-4 w-4" />)}
              {navItem("Analisis", "analyze", <FileSearch className="h-4 w-4" />)}
              {navItem("Contoh", "samples", <FileText className="h-4 w-4" />)}
              {navItem("Insight", "insights", <BarChart3 className="h-4 w-4" />)}
              {navItem("Riwayat", "history", <History className="h-4 w-4" />)}
              {user.plan === "ADMIN" && navItem("Admin", "admin", <ShieldCheck className="h-4 w-4" />)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 px-2">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-sm">Bantuan</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setView("faq")}>
                    <HelpCircle className="mr-2 h-4 w-4" /> FAQ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("glossary")}>
                    <BookOpen className="mr-2 h-4 w-4" /> Glosarium Hukum
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("pricing")}>
                    <Sparkles className="mr-2 h-4 w-4" /> Harga & Paket
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("consultation")}>
                    <Sparkles className="mr-2 h-4 w-4" /> Konsultasi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-1 gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate text-sm">{user.displayName || user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="text-sm font-medium">{user.displayName || user.username}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    <span className="mt-1 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      {user.plan}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setView("settings")}>
                    <Settings className="mr-2 h-4 w-4" /> Pengaturan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("consultation")}>
                    <Sparkles className="mr-2 h-4 w-4" /> Konsultasi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </>
          ) : (
            <>
              {navItem("Cara Kerja", "home")}
              {navItem("Harga", "pricing")}
              <Button variant="ghost" onClick={() => setView("signin")} className="ml-1">
                Masuk
              </Button>
              <Button onClick={() => setView("signup")} className="gap-1">
                Daftar Gratis
              </Button>
              <ThemeToggle />
            </>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-1">
                {user ? (
                  <>
                    <div className="mb-2 rounded-lg bg-muted p-3">
                      <p className="text-sm font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {navItem("Dashboard", "dashboard", <LayoutDashboard className="h-4 w-4" />)}
                    {navItem("Analisis Kontrak", "analyze", <FileSearch className="h-4 w-4" />)}
                    {navItem("Contoh Kontrak", "samples", <FileText className="h-4 w-4" />)}
                    {navItem("Insight & Statistik", "insights", <BarChart3 className="h-4 w-4" />)}
                    {navItem("Riwayat", "history", <History className="h-4 w-4" />)}
                    {user.plan === "ADMIN" && navItem("Admin License", "admin", <ShieldCheck className="h-4 w-4" />)}
                    {navItem("FAQ", "faq", <HelpCircle className="h-4 w-4" />)}
                    {navItem("Glosarium Hukum", "glossary", <BookOpen className="h-4 w-4" />)}
                    {navItem("Harga", "pricing", <Sparkles className="h-4 w-4" />)}
                    {navItem("Pengaturan", "settings", <Settings className="h-4 w-4" />)}
                    {navItem("Konsultasi", "consultation", <Sparkles className="h-4 w-4" />)}
                    <Button variant="outline" onClick={logout} className="mt-2 justify-start gap-2">
                      <LogOut className="h-4 w-4" /> Keluar
                    </Button>
                  </>
                ) : (
                  <>
                    {navItem("Cara Kerja", "home")}
                    {navItem("Contoh Kontrak", "samples", <FileText className="h-4 w-4" />)}
                    {navItem("Harga", "pricing", <Sparkles className="h-4 w-4" />)}
                    {navItem("FAQ", "faq", <HelpCircle className="h-4 w-4" />)}
                    {navItem("Glosarium", "glossary", <BookOpen className="h-4 w-4" />)}
                    {navItem("Konsultasi", "consultation", <Sparkles className="h-4 w-4" />)}
                    <Button variant="outline" onClick={() => { setView("signin"); setOpen(false); }} className="mt-2">
                      Masuk
                    </Button>
                    <Button onClick={() => { setView("signup"); setOpen(false); }} className="gap-1">
                      Daftar Gratis
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
