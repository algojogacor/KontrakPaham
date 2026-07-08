import { jsPDF } from "jspdf";
import type { AnalysisWithFindings } from "@/lib/types";

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  RENDAH: [34, 139, 87],
  SEDANG: [202, 138, 4],
  TINGGI: [220, 90, 50],
  KRITIS: [185, 28, 28],
};

// Human-readable labels for enum values
const URGENCY_LABEL: Record<string, string> = {
  INFO: "Info",
  PERHATIAN: "Perhatian",
  PERLU_TINDAKAN: "Perlu Tindakan",
};

const SEVERITY_LABEL: Record<string, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
  KRITIS: "Kritis",
};

/** Strip markdown symbols so plain-text PDF looks clean */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")        // **bold** -> bold
    .replace(/\*([^*]+)\*/g, "$1")             // *italic* -> italic
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, "")  // [[1]], [[1,2]] -> remove
    .replace(/^#{1,4}\s+/gm, "")              // ### heading -> remove hashes
    .replace(/^-{3,}$/gm, "-".repeat(50))     // --- divider -> ASCII dashes
    .replace(/\n{3,}/g, "\n\n")               // collapse extra blank lines
    .trim();
}

function hex(rgb: [number, number, number]) {
  return rgb;
}

export function generateAnalysisPdf(
  analysis: AnalysisWithFindings,
  userLabel: string
): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("KontrakPaham", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Laporan Analisis Kontrak", margin, 50);
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.text(
    "Dibuat untuk edukasi, bukan nasihat hukum definitif",
    pageW - margin,
    50,
    { align: "right" }
  );
  y = 92;

  // Title
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(analysis.title || "Analisis Kontrak", contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 18 + 6;

  // Meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  const dateStr = new Date(analysis.createdAt).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
  doc.text(`Dianalisis: ${dateStr}`, margin, y);
  y += 13;
  doc.text(`Sumber: ${analysis.sourceType}${analysis.fileName ? " - " + analysis.fileName : ""}`, margin, y);
  y += 13;
  doc.text(`Pemilik akun: ${userLabel}`, margin, y);
  y += 18;

  // Risk badge
  const riskColor = SEVERITY_COLORS[analysis.overallRisk || "SEDANG"] || SEVERITY_COLORS.SEDANG;
  doc.setFillColor(...hex(riskColor));
  doc.roundedRect(margin, y, 230, 26, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Risiko Keseluruhan: ${analysis.overallRisk || "SEDANG"}`, margin + 10, y + 17);
  y += 18;
  doc.setTextColor(90, 90, 90);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Skor risiko: ${analysis.riskScore ?? "-"}/100`, margin + 240, y);
  y += 22;

  // Summary
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ringkasan", margin, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const sumLines = doc.splitTextToSize(analysis.summary || "-", contentW);
  for (const line of sumLines) {
    ensureSpace(14);
    doc.text(line, margin, y);
    y += 14;
  }
  y += 12;

  // Research sources
  if ((analysis.researchSources && analysis.researchSources.length > 0) || analysis.researchContent) {
    ensureSpace(50);
    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Sumber Riset Hukum", margin, y);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const researchMeta = [
      analysis.researchEffort ? `Effort: ${analysis.researchEffort}` : null,
      analysis.researchLatencyMs ? `Latency: ${(analysis.researchLatencyMs / 1000).toFixed(1)} detik` : null,
    ].filter(Boolean).join(" - ");
    if (researchMeta) {
      doc.text(researchMeta, margin, y);
      y += 13;
    }

    if (analysis.researchSources && analysis.researchSources.length > 0) {
      analysis.researchSources.forEach((source, index) => {
        ensureSpace(28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        const titleLines = doc.splitTextToSize(`${index + 1}. ${source.title}`, contentW);
        for (const line of titleLines) {
          ensureSpace(12);
          doc.text(line, margin, y);
          y += 12;
        }
        doc.setFont("helvetica", "normal");
        doc.setTextColor(37, 99, 235);
        const urlLines = doc.splitTextToSize(source.url, contentW);
        for (const line of urlLines) {
          ensureSpace(12);
          doc.text(line, margin + 12, y);
          y += 12;
        }
      });
    }

    if (analysis.researchContent) {
      ensureSpace(28);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text("RINGKASAN RISET HUKUM", margin, y);
      y += 13;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      // Strip markdown and cap length to keep PDF compact
      const rawResearch = analysis.researchContent.slice(0, 2500);
      const isTruncated = analysis.researchContent.length > 2500;
      const cleanResearch = stripMarkdown(rawResearch) + (isTruncated ? "\n\n[...lihat selengkapnya di aplikasi KontrakPaham]" : "");
      const researchLines = doc.splitTextToSize(cleanResearch, contentW);
      for (const line of researchLines) {
        ensureSpace(11);
        doc.text(line, margin, y);
        y += 11;
      }
    }
    y += 12;
  }

  // Findings
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(24, 24, 27);
  ensureSpace(20);
  doc.text(`Temuan Klausul (${analysis.findings.length})`, margin, y);
  y += 16;

  if (analysis.findings.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    const nl = doc.splitTextToSize(
      "Tidak ada temuan klausul bermasalah yang terdeteksi. Dokumen mungkin bukan kontrak atau tidak mengandung klausul berisiko signifikan.",
      contentW
    );
    for (const line of nl) {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 12;
  }

  analysis.findings.forEach((f, idx) => {
    ensureSpace(80);
    const sevColor = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.SEDANG;
    // Card background
    const cardTop = y;
    doc.setFillColor(248, 248, 250);
    doc.setDrawColor(225, 225, 230);
    // We'll draw the card after measuring height; approximate with iterative text layout.
    // Simpler: draw a light separator and content, with a colored severity strip.
    doc.setFillColor(...hex(sevColor));
    doc.rect(margin, y, 4, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27);
    doc.text(`${idx + 1}. ${f.categoryLabel}`, margin + 12, y + 12);
    // severity + urgency badges (text)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...hex(sevColor));
    doc.text(SEVERITY_LABEL[f.severity] || f.severity, pageW - margin, y + 12, { align: "right" });
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    const urgencyLabel = URGENCY_LABEL[f.urgency] || f.urgency;
    const severityLabel = SEVERITY_LABEL[f.severity] || f.severity;
    const actionLabel = f.actionType === "BUTUH_NASIHAT" ? "Butuh Nasihat" : "Info Umum";
    const meta = `Confidence ${f.confidence}% · Urgensi: ${urgencyLabel} · ${actionLabel}`;
    doc.text(meta, margin + 12, y);
    y += 14;

    const writeBlock = (label: string, text: string, color: [number, number, number]) => {
      ensureSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(label.toUpperCase(), margin + 12, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(text || "-", contentW - 24);
      for (const line of lines) {
        ensureSpace(13);
        doc.text(line, margin + 12, y);
        y += 13;
      }
      y += 6;
    };

    writeBlock("Klausul Asli", f.originalClause, [110, 110, 110]);
    writeBlock("Bahasa Awam", f.plainTranslation, [34, 139, 87]);
    writeBlock("Mengapa Berisiko", f.explanation, [202, 138, 4]);
    writeBlock("Saran Tindakan", f.recommendation, [37, 99, 235]);

    if (f.location) {
      ensureSpace(12);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(`Lokasi: ${f.location}`, margin + 12, y);
      y += 12;
    }
    y += 10;
    // Separator
    ensureSpace(6);
    doc.setDrawColor(228, 228, 232);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
    void cardTop;
  });

  // Notes
  if (analysis.notes && analysis.notes.length > 0) {
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27);
    doc.text("Catatan", margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    for (const n of analysis.notes) {
      const lines = doc.splitTextToSize("• " + n, contentW);
      for (const line of lines) {
        ensureSpace(13);
        doc.text(line, margin, y);
        y += 13;
      }
    }
    y += 10;
  }

  // Disclaimer page
  doc.addPage();
  y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27);
  doc.text("Disclaimer Penting", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const disclaimer = [
    "Laporan ini dihasilkan oleh sistem otomatis berbasis kecerdasan buatan dan disusun untuk tujuan EDUKASI dan gambaran umum, BUKAN nasihat hukum definitif.",
    "Sistem ini dikelola oleh mahasiswa hukum UNAIR, BUKAN advokat berlisensi. Hasil analisis bisa salah, tidak lengkap, atau tidak menangkap konteks spesifik perjanjian Anda.",
    "Untuk keputusan penting (menandatangani kontrak, sengketa, transaksi besar), konsultasikan dengan advokat berlisensi yang memahami konteks Anda.",
    "Tingkat keyakinan (confidence) dan tingkat risiko adalah estimasi heuristik, bukan jaminan.",
    "Dengan menggunakan layanan ini, Anda memahami batasan tersebut.",
  ];
  for (const d of disclaimer) {
    const lines = doc.splitTextToSize(d, contentW);
    for (const line of lines) {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 6;
  }
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text("Butuh diskusi lanjutan?", margin, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const contact = [
    "WhatsApp: 08999021644",
    "Instagram: @aryarizky04",
    "Email: aryarizkyardhipratama@gmail.com",
  ];
  for (const c of contact) {
    ensureSpace(14);
    doc.text(c, margin, y);
    y += 14;
  }

  // Footer page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`KontrakPaham · Halaman ${i} dari ${pages}`, pageW / 2, pageH - 20, {
      align: "center",
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
