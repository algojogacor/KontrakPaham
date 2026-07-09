import { LegalDeskScene } from "@/components/app/legal-desk-scene";

export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm text-center">
        <LegalDeskScene compact loading />
        <div className="mt-5">
          <p className="font-display text-lg font-semibold text-ink">Memuat KontrakPaham...</p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Menyiapkan sesi dan ruang kerja.
          </p>
        </div>
      </div>
    </div>
  );
}
