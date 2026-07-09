import { AlertTriangle, FileText, Scale } from "lucide-react";
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
          <MascotPortrait compact />
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
            <div className="analysis-ribbon-clause">
              <span className="analysis-ribbon-clause__label">Pasal 4 - Biaya sewa</span>
              <span>Penyewa wajib membayar sewa kamar setiap tanggal 5.</span>
            </div>
            <div className="analysis-ribbon-clause">
              <span className="analysis-ribbon-clause__label">Pasal 7 - Denda</span>
              <span className="analysis-ribbon-highlight">Denda keterlambatan 5% per hari dari total sewa.</span>
            </div>
            <div className="analysis-ribbon-note">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Risiko tinggi: angka denda perlu dinegosiasikan.</span>
            </div>
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
          <MascotPortrait />
          <div className="analysis-ribbon-source">
            <Scale className="h-4 w-4 text-primary" />
            <span>Konteks pasal lokal ikut dibaca saat analisis.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MascotPortrait({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("mascot-portrait", compact ? "mascot-portrait--compact" : "")}>
      <span className="mascot-portrait__horn mascot-portrait__horn--left" />
      <span className="mascot-portrait__horn mascot-portrait__horn--right" />
      <div className="mascot-portrait__head">
        <span className="mascot-portrait__hair mascot-portrait__hair--one" />
        <span className="mascot-portrait__hair mascot-portrait__hair--two" />
        <span className="mascot-portrait__ear mascot-portrait__ear--left" />
        <span className="mascot-portrait__ear mascot-portrait__ear--right" />
        <span className="mascot-portrait__brow mascot-portrait__brow--left" />
        <span className="mascot-portrait__brow mascot-portrait__brow--right" />
        <span className="mascot-portrait__eye mascot-portrait__eye--left" />
        <span className="mascot-portrait__eye mascot-portrait__eye--right" />
        <span className="mascot-portrait__snout">
          <span />
          <span />
        </span>
        <span className="mascot-portrait__smile" />
      </div>
      <div className="mascot-portrait__body">
        <span className="mascot-portrait__collar" />
        <span className="mascot-portrait__folder">
          <span />
          <span />
          <span />
        </span>
        <span className="mascot-portrait__hand mascot-portrait__hand--left" />
        <span className="mascot-portrait__hand mascot-portrait__hand--right" />
      </div>
      <div className="mascot-portrait__base">
        <span />
      </div>
    </div>
  );
}
