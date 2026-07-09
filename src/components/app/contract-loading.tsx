"use client";

import { LegalDeskScene } from "@/components/app/legal-desk-scene";
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
      <LegalDeskScene compact={compact} loading />
      <div>
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
