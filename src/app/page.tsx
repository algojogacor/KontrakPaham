"use client";

import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { useApp } from "@/lib/store";
import { ContractLoading } from "@/components/app/contract-loading";
import { SiteFooter } from "@/components/app/site-footer";
import { SiteNav } from "@/components/app/site-nav";
import { AnalyzeView } from "@/components/app/views/analyze-view";
import { AdminView } from "@/components/app/views/admin-view";
import { AuthView } from "@/components/app/views/auth-view";
import { ChecklistView } from "@/components/app/views/checklist-view";
import { ConsultationView } from "@/components/app/views/consultation-view";
import { DashboardView } from "@/components/app/views/dashboard-view";
import { FaqView } from "@/components/app/views/faq-view";
import { GlossaryView } from "@/components/app/views/glossary-view";
import { HistoryView } from "@/components/app/views/history-view";
import { HomeView } from "@/components/app/views/home-view";
import { InsightsView } from "@/components/app/views/insights-view";
import { LegalView } from "@/components/app/views/legal-view";
import { PricingView } from "@/components/app/views/pricing-view";
import { ResultView } from "@/components/app/views/result-view";
import { SamplesView } from "@/components/app/views/samples-view";
import { SettingsView } from "@/components/app/views/settings-view";
import { NegotiationView } from "@/components/app/views/negotiation-view";


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
  }, [setAuth, setAuthLoading]);

  const protectedViews = ["dashboard", "analyze", "result", "history", "settings", "insights", "checklist", "admin", "negotiation"];
  useEffect(() => {
    if (!authLoading && !user && protectedViews.includes(view)) {
      setView("signin");
    }
  }, [authLoading, user, view, setView]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteNav />
        <div className="flex flex-1 items-center justify-center px-4">
          <ContractLoading title="Memuat KontrakPaham..." detail="Menyiapkan sesi, kuota, dan ruang kerja Anda." />
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="route-surface flex-1">
        {view === "home" && <HomeView />}
        {(view === "signin" || view === "signup" || view === "forgot" || view === "reset") && <AuthView />}
        {view === "dashboard" && <DashboardView />}
        {view === "admin" && <AdminView />}
        {view === "analyze" && <AnalyzeView />}
        {view === "result" && <ResultView />}
        {view === "history" && <HistoryView />}
        {view === "settings" && <SettingsView />}
        {view === "consultation" && <ConsultationView />}
        {view === "pricing" && <PricingView />}
        {view === "faq" && <FaqView />}
        {view === "glossary" && <GlossaryView />}
        {view === "samples" && <SamplesView />}
        {view === "insights" && <InsightsView />}
        {view === "checklist" && <ChecklistView />}
        {view === "legal" && <LegalView />}
        {view === "negotiation" && <NegotiationView />}
      </main>
      <SiteFooter />
    </div>
  );
}
