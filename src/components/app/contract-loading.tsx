"use client";

import { FileText, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContractLoading({
  title = "Membaca kontrak...",
  detail = "Sistem sedang menyiapkan dokumen dan konteks akun Anda.",
  compact = false,
  className,
}: {
  title?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "gap-3" : "gap-5", className)}>
      <div className={cn("contract-loader relative", compact ? "scale-90" : "")} aria-hidden="true">
        <div className="contract-loader__page">
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-2.5 p-3">
            <span className="block h-2 w-20 rounded-full bg-ink/20" />
            <span className="block h-2 w-full rounded-full bg-muted" />
            <span className="block h-2 w-11/12 rounded-full bg-muted" />
            <span className="block h-2 w-9/12 rounded-full bg-amber-300/60" />
            <span className="block h-2 w-10/12 rounded-full bg-muted" />
            <span className="block h-2 w-7/12 rounded-full bg-primary/25" />
          </div>
          <div className="contract-loader__scan" />
        </div>
        <div className="contract-loader__badge">
          <ScanLine className="h-3 w-3" />
          OCR
        </div>
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
