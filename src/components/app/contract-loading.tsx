"use client";

import { MascotPortrait } from "@/components/app/legal-desk-scene";
import { cn } from "@/lib/utils";

export function ContractLoading({
  title = "Membaca kontrak...",
  detail = "Sistem sedang menyiapkan dokumen dan konteks akun Anda.",
  compact = true,
  className,
}: {
  title?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "gap-3" : "gap-5", className)}>
      <ContractLoadingMark compact={compact} />
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function ContractLoadingMark({ compact }: { compact: boolean }) {
  return (
    <div className={cn("contract-loading-mark", compact ? "contract-loading-mark--compact" : "")} aria-hidden="true">
      <div className="contract-loading-mark__card">
        <div className="contract-loading-mark__paper">
          <span className="contract-loading-mark__title">kontrak.pdf</span>
          <span />
          <span />
          <span />
        </div>
        <MascotPortrait className="mascot-portrait--loading" />
        <div className="contract-loading-mark__steps">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="contract-loading-mark__scan" />
      </div>
    </div>
  );
}
