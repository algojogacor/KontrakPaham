"use client";

import { cn } from "@/lib/utils";
import type { Severity, Urgency, ActionType, OverallRisk } from "@/lib/types";
import { ShieldAlert, ShieldCheck, ShieldQuestion, Info, AlertTriangle, Siren } from "lucide-react";

const SEVERITY_STYLES: Record<Severity, string> = {
  RENDAH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-800",
  SEDANG: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/60 dark:border-amber-800",
  TINGGI: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300/60 dark:border-orange-800",
  KRITIS: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300/60 dark:border-red-800",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        SEVERITY_STYLES[severity],
        className
      )}
    >
      {severity === "KRITIS" && <Siren className="h-3 w-3" />}
      {severity === "TINGGI" && <ShieldAlert className="h-3 w-3" />}
      {severity === "SEDANG" && <AlertTriangle className="h-3 w-3" />}
      {severity === "RENDAH" && <ShieldCheck className="h-3 w-3" />}
      {severity}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const map: Record<Urgency, { cls: string; icon: React.ReactNode; label: string }> = {
    INFO: {
      cls: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-300/60 dark:border-sky-800",
      icon: <Info className="h-3 w-3" />,
      label: "Info umum",
    },
    PERHATIAN: {
      cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300/60 dark:border-amber-800",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Perhatian",
    },
    PERLU_TINDAKAN: {
      cls: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300/60 dark:border-red-800",
      icon: <Siren className="h-3 w-3" />,
      label: "Perlu tindakan",
    },
  };
  const m = map[urgency];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", m.cls)}>
      {m.icon}
      {m.label}
    </span>
  );
}

export function ActionTypeBadge({ type }: { type: ActionType }) {
  if (type === "INFO_UMUM") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/60 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
        <ShieldQuestion className="h-3 w-3" /> Info umum
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
      <ShieldAlert className="h-3 w-3" /> Butuh nasihat
    </span>
  );
}

const RISK_STYLES: Record<OverallRisk, { cls: string; label: string; icon: React.ReactNode }> = {
  RENDAH: { cls: "from-emerald-500 to-emerald-600", label: "Risiko Rendah", icon: <ShieldCheck className="h-5 w-5" /> },
  SEDANG: { cls: "from-amber-500 to-amber-600", label: "Risiko Sedang", icon: <AlertTriangle className="h-5 w-5" /> },
  TINGGI: { cls: "from-orange-500 to-orange-600", label: "Risiko Tinggi", icon: <ShieldAlert className="h-5 w-5" /> },
  KRITIS: { cls: "from-red-500 to-red-600", label: "Risiko Kritis", icon: <Siren className="h-5 w-5" /> },
};

export function RiskPill({ risk, size = "md" }: { risk: OverallRisk; size?: "sm" | "md" }) {
  const m = RISK_STYLES[risk] || RISK_STYLES.SEDANG;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r text-white font-semibold shadow-sm",
        m.cls,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}
