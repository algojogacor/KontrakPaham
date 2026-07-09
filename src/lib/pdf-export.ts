import { jsPDF } from "jspdf";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AnalysisWithFindings } from "@/lib/types";

const BRAND = {
  ivory: [247, 244, 237] as [number, number, number],
  ink: [31, 27, 22] as [number, number, number],
  forest: [30, 77, 59] as [number, number, number],
  amber: [197, 138, 46] as [number, number, number],
  stone: [217, 213, 204] as [number, number, number],
  muted: [102, 96, 88] as [number, number, number],
  paperLine: [187, 179, 164] as [number, number, number],
};

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  RENDAH: [34, 139, 87],
  SEDANG: [202, 138, 4],
  TINGGI: [220, 90, 50],
  KRITIS: [185, 28, 28],
};

let cachedLogoDataUrl: string | null | undefined;

function getLogoDataUrl() {
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;

  try {
    const logoPath = join(process.cwd(), "public", "brand", "kontrakpaham-logo-transparent.png");
    cachedLogoDataUrl = `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch {
    cachedLogoDataUrl = null;
  }

  return cachedLogoDataUrl;
}

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

function drawCoverPage(doc: jsPDF, analysis: AnalysisWithFindings, userLabel: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const splitX = pageW * 0.565;
  const leftPad = 70;
  const dateStr = new Date(analysis.createdAt).toLocaleDateString("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  });
  const documentName = analysis.title || analysis.fileName || "Analisis Kontrak";

  doc.setFillColor(...BRAND.ivory);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFillColor(...BRAND.forest);
  doc.rect(0, 0, splitX, pageH, "F");
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BRAND.stone);
  doc.rect(splitX, 0, pageW - splitX, pageH, "FD");

  const paperX = splitX + 74;
  const paperY = 178;
  const paperW = 162;
  const paperH = 396;
  doc.setFillColor(248, 244, 234);
  doc.setDrawColor(214, 207, 193);
  doc.roundedRect(paperX, paperY, paperW, paperH, 10, 10, "FD");
  doc.setFillColor(255, 252, 244);
  doc.triangle(paperX, paperY, paperX + 78, paperY, paperX, paperY + 78, "F");
  doc.setDrawColor(218, 209, 194);
  doc.line(paperX, paperY + 78, paperX + 78, paperY);
  doc.setDrawColor(...BRAND.paperLine);
  for (let i = 0; i < 6; i++) {
    const lineY = paperY + 138 + i * 42;
    doc.line(paperX + 42, lineY, paperX + paperW - 34, lineY);
  }

  // Golden Stamp on the paper
  doc.setFillColor(...BRAND.amber);
  doc.circle(paperX + paperW - 54, paperY + paperH - 74, 38, "F");
  doc.setDrawColor(142, 89, 32);
  doc.setLineWidth(2);
  doc.circle(paperX + paperW - 54, paperY + paperH - 74, 30, "S");
  doc.setFont("times", "bold");
  doc.setFontSize(36);
  doc.setTextColor(104, 67, 32);
  doc.text("K", paperX + paperW - 68, paperY + paperH - 62);
  doc.setLineWidth(1);

  // Logo & Brand Header on the left
  const logoDataUrl = getLogoDataUrl();
  const boxSize = 48;
  const logoSize = 36;
  if (logoDataUrl) {
    doc.setFillColor(255, 255, 255); // Pure white box for crispness
    doc.setDrawColor(218, 209, 194);
    doc.roundedRect(leftPad - 8, 82, boxSize, boxSize, 8, 8, "FD");
    doc.addImage(logoDataUrl, "PNG", leftPad - 8 + (boxSize - logoSize)/2, 82 + (boxSize - logoSize)/2, logoSize, logoSize);
  } else {
    doc.setTextColor(...BRAND.ivory);
    doc.setFont("times", "bold");
    doc.setFontSize(34);
    doc.text("K", leftPad, 110);
  }
  
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...BRAND.ivory);
  doc.text("KontrakPaham", leftPad, 154);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.amber);
  doc.text("CLARITY BEFORE SIGNATURE", leftPad, 174, { charSpace: 4 });

  // Main Titles
  doc.setFont("times", "bold");
  doc.setFontSize(54);
  doc.setTextColor(...BRAND.ivory);
  ["Ringkasan", "Tinjauan", "Kontrak"].forEach((line, index) => {
    doc.text(line, leftPad, 290 + index * 58);
  });
  
  doc.setDrawColor(...BRAND.amber);
  doc.setLineWidth(1.2);
  doc.line(leftPad, 476, leftPad + 42, 476);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(17);
  doc.setTextColor(239, 232, 219);
  doc.text("Pahami. Nilai. Kendalikan.", leftPad, 514);

  // Metadata Section
  const metadata = [
    ["DOKUMEN:", documentName],
    ["TANGGAL ANALISIS:", dateStr],
    ["DISIAPKAN UNTUK:", userLabel],
  ];
  metadata.forEach(([label, value], index) => {
    const y = 585 + index * 67;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.amber);
    doc.text(label, leftPad, y, { charSpace: 2.4 });
    doc.setFont("times", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...BRAND.ivory);
    const lines = doc.splitTextToSize(value, splitX - leftPad - 78).slice(0, 2);
    doc.text(lines, leftPad, y + 24);
    doc.setDrawColor(218, 185, 116);
    doc.setLineWidth(0.5);
    doc.line(leftPad, y + 44, leftPad + 170, y + 44);
  });

  // Footer Section
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(226, 216, 196);
  doc.text(`DOC-${new Date(analysis.createdAt).getFullYear()}-${analysis.id.slice(0, 6).toUpperCase()}`, leftPad, pageH - 90);

  // Custom Contact Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.ivory);
  const contactInfo = [
    "WhatsApp: 08999021644",
    "Instagram: @aryarizky04",
    "Email: aryarizkyardhipratama@gmail.com"
  ];
  contactInfo.forEach((line, i) => {
    doc.text(line, leftPad, pageH - 64 + (i * 12));
  });
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

  drawCoverPage(doc, analysis, userLabel);
  doc.addPage();

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
    if (i === 1) continue;
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`KontrakPaham - Halaman ${i - 1} dari ${pages - 1}`, pageW / 2, pageH - 20, {
      align: "center",
    });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
