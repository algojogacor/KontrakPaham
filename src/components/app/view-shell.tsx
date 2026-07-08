"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  children,
  size = "wide",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  size?: "narrow" | "medium" | "wide";
  className?: string;
}) {
  const maxWidth = {
    narrow: "max-w-3xl",
    medium: "max-w-5xl",
    wide: "max-w-6xl",
  }[size];

  return (
    <section className={cn("mx-auto w-full px-4 py-6 sm:py-8", maxWidth, className)}>
      <div className="grid gap-4 border-b border-border/70 pb-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-primary/45" />
              {eyebrow}
            </p>
          )}
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-soft sm:flex">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-balance font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl lg:text-4xl">
                {title}
              </h1>
              {description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
        {actions && <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">{actions}</div>}
      </div>
      <div className="pt-5 sm:pt-6">{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  onClick,
  children,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  children?: React.ReactNode;
  tone?: "default" | "primary" | "amber";
}) {
  const toneClass = {
    default: "bg-card",
    primary: "bg-primary/5 border-primary/20",
    amber: "bg-amber-50/70 border-amber-300/50 dark:bg-amber-950/20 dark:border-amber-700/40",
  }[tone];

  const content = (
    <div className={cn("h-full rounded-xl border p-4 shadow-soft transition-all", toneClass, onClick && "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft-lg")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/70 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</div>
      {detail && <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );

  if (!onClick) return content;
  return (
    <button type="button" onClick={onClick} className="h-full w-full text-left">
      {content}
    </button>
  );
}
