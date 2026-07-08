"use client";

import { create } from "zustand";
import type { AnalysisDto, QuotaDto, UserDto } from "@/lib/types";

export type View =
  | "home"
  | "signin"
  | "signup"
  | "forgot"
  | "reset"
  | "dashboard"
  | "analyze"
  | "result"
  | "history"
  | "settings"
  | "consultation"
  | "pricing"
  | "faq"
  | "glossary"
  | "samples"
  | "insights"
  | "checklist"
  | "legal"
  | "negotiation"
  | "admin";

interface AppState {
  user: UserDto | null;
  quota: QuotaDto | null;
  view: View;
  currentAnalysis: AnalysisDto | null;
  resetToken: string | null;
  authLoading: boolean;
  legalDocSlug: string | null;
  setAuth: (user: UserDto | null, quota: QuotaDto | null) => void;
  setView: (view: View) => void;
  setQuota: (quota: QuotaDto | null) => void;
  setCurrentAnalysis: (a: AnalysisDto | null) => void;
  setResetToken: (t: string | null) => void;
  setAuthLoading: (b: boolean) => void;
  setLegalDocSlug: (s: string | null) => void;
}

export const useApp = create<AppState>((set) => ({
  user: null,
  quota: null,
  view: "home",
  currentAnalysis: null,
  resetToken: null,
  authLoading: true,
  legalDocSlug: null,
  setAuth: (user, quota) =>
    set((s) => ({
      user,
      quota,
      view: user
        ? s.view === "signin" || s.view === "signup" || s.view === "forgot" || s.view === "reset"
          ? "dashboard"
          : s.view
        : s.view === "dashboard" || s.view === "analyze" || s.view === "result" || s.view === "history" || s.view === "settings" || s.view === "insights" || s.view === "admin" || s.view === "checklist" || s.view === "negotiation"
          ? "home"
          : s.view,
    })),
  setView: (view) => {
    const update = () => set({ view });
    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(update);
    } else {
      update();
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  setQuota: (quota) => set({ quota }),
  setCurrentAnalysis: (a) => set({ currentAnalysis: a }),
  setResetToken: (t) => set({ resetToken: t }),
  setAuthLoading: (b) => set({ authLoading: b }),
  setLegalDocSlug: (s) => set({ legalDocSlug: s }),
}));
