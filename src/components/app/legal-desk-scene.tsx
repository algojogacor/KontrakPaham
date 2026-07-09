import { FileText, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function LegalDeskScene({
  compact = false,
  loading = false,
  className,
}: {
  compact?: boolean;
  loading?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn("analysis-ribbon-scene analysis-ribbon-scene--compact relative mx-auto h-[132px] w-[250px]", className)} aria-hidden="true">
        <div className="analysis-ribbon-shell">
          <GuardianSeal compact />
          <div className="analysis-ribbon-track">
            <div className="analysis-ribbon-line" />
            <div className="analysis-ribbon-fields">
              <span />
              <span />
              <span />
              <span />
            </div>
            {loading && <div className="analysis-ribbon-scan" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("analysis-ribbon-scene relative mx-auto h-[420px] w-full max-w-[640px]", className)} aria-hidden="true">
      <div className="analysis-ribbon-board">
        <div className="analysis-ribbon-board__grain" />
        <div className="analysis-ribbon-document">
          <div className="analysis-ribbon-document__head">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>kontrak-sewa.pdf</span>
            </div>
            <div className="analysis-ribbon-document__meter">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="analysis-ribbon-document__body">
            <span className="w-24 bg-ink/25" />
            <span className="w-full" />
            <span className="w-11/12" />
            <span className="analysis-ribbon-highlight w-8/12" />
            <span className="w-10/12" />
          </div>

          <div className="analysis-ribbon-track analysis-ribbon-track--wide">
            <div className="analysis-ribbon-line" />
            <div className="analysis-ribbon-fields">
              {["OCR", "Denda", "Sepihak", "Saran"].map((label, index) => (
                <div key={label} className="analysis-ribbon-field">
                  <span className="analysis-ribbon-field__dot" />
                  <span className="analysis-ribbon-field__label">{label}</span>
                  <span className="analysis-ribbon-field__value">{["terbaca", "tinggi", "nego", "siap"][index]}</span>
                </div>
              ))}
            </div>
            {loading && <div className="analysis-ribbon-scan" />}
          </div>
        </div>

        <div className="analysis-ribbon-side">
          <GuardianSeal />
          <div className="analysis-ribbon-source">
            <Scale className="h-4 w-4 text-primary" />
            <span>Konteks pasal lokal ikut dibaca saat analisis.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuardianSeal({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("guardian-seal", compact ? "guardian-seal--compact" : "")}>
      <div className="guardian-seal__head">
        <span className="guardian-seal__horn guardian-seal__horn--left" />
        <span className="guardian-seal__horn guardian-seal__horn--right" />
        <span className="guardian-seal__ear guardian-seal__ear--left" />
        <span className="guardian-seal__ear guardian-seal__ear--right" />
        <span className="guardian-seal__eye guardian-seal__eye--left" />
        <span className="guardian-seal__eye guardian-seal__eye--right" />
        <span className="guardian-seal__muzzle" />
      </div>
      <div className="guardian-seal__base">
        <span />
        <span />
      </div>
    </div>
  );
}
