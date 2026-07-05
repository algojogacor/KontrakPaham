"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { api, friendlyError } from "@/lib/api-client";
import { SiteNav } from "@/components/app/site-nav";
import { SiteFooter } from "@/components/app/site-footer";
import { HomeView } from "@/components/app/views/home-view";
import { AuthView } from "@/components/app/views/auth-view";
import { DashboardView } from "@/components/app/views/dashboard-view";
import { AnalyzeView } from "@/components/app/views/analyze-view";
import { ResultView } from "@/components/app/views/result-view";
import { HistoryView } from "@/components/app/views/history-view";
import { SettingsView } from "@/components/app/views/settings-view";
import { ConsultationView } from "@/components/app/views/consultation-view";
import { PricingView } from "@/components/app/views/pricing-view";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { view, user, authLoading, setAuth, setAuthLoading, setView } = useApp();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user, quota } = await api.getMe();
        if (!cancelled) setAuth(user, quota);
      } catch {
        if (!cancelled) setAuth(null, null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gate protected views
  const protectedViews = ["dashboard", "analyze", "result", "history", "settings"];
  useEffect(() => {
    if (!authLoading && !user && protectedViews.includes(view)) {
      setView("signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, view]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNav />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Memuat KontrakPaham…</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">
        {view === "home" && <HomeView />}
        {(view === "signin" || view === "signup" || view === "forgot" || view === "reset") && <AuthView />}
        {view === "dashboard" && <DashboardView />}
        {view === "analyze" && <AnalyzeView />}
        {view === "result" && <ResultView />}
        {view === "history" && <HistoryView />}
        {view === "settings" && <SettingsView />}
        {view === "consultation" && <ConsultationView />}
        {view === "pricing" && <PricingView />}
      </main>
      <SiteFooter />
    </div>
  );
}
