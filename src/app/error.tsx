"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for debugging (production would ship to aggregator)
    console.error("KontrakPaham error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Ada yang tidak beres
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Maaf, terjadi kesalahan tak terduga. Anda bisa mencoba lagi — jika masalah
          berlanjut, muat ulang halaman atau hubungi kami.
        </p>

        {process.env.NODE_ENV === "development" && error?.message && (
          <details className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Detail error (mode dev)
            </summary>
            <pre className="mt-2 overflow-auto text-[11px] text-destructive">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
          </details>
        )}

        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Coba lagi
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/";
            }}
            className="gap-2"
          >
            <Home className="h-4 w-4" /> Ke beranda
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Butuh bantuan? WhatsApp 08999021644 · email aryarizkyardhipratama@gmail.com
        </p>
      </div>
    </div>
  );
}
