"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MascotPortrait } from "@/components/app/mascot-system";

export function ContractLoading({
  title = "Sedang membaca pasal satu per satu...",
  detail = "Harap tunggu sebentar. Ini butuh beberapa detik.",
  compact = true,
  className,
}: {
  title?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center animate-in fade-in duration-500", compact ? "gap-3" : "gap-8 min-h-[300px]", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-full" />
        
        <div className={cn("relative mx-auto animate-pulse", compact ? "w-[76px] h-[104px]" : "w-[146px] h-[202px]")}>
          <MascotPortrait scale={compact ? 0.6 : 1} className="origin-center mascot-portrait--loading" />
        </div>
      </div>

      <div className="max-w-xs mx-auto">
        <h3 className={cn("font-serif font-bold text-foreground", compact ? "text-base" : "text-xl")}>
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {detail}
        </p>
      </div>
    </div>
  );
}
