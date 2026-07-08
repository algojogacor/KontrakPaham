import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import mammoth from "mammoth";
import sharp from "sharp";
import { logger } from "@/lib/logger";

// pdfjs worker resolution under Next.js/Turbopack/Bun is extremely fragile when
// loading files dynamically via workerSrc (e.g. throwing "Invalid URL").
// The most robust approach is statically importing the worker module and registering
// it on globalThis.pdfjsWorker. This bypasses workerSrc dynamic imports entirely.
(globalThis as any).pdfjsWorker = pdfjsWorker;



export interface ParsedDocument {
  text: string;
  sourceType: "PDF" | "DOCX" | "TEXT";
  fileName?: string;
  ocrUsed: boolean;
  warnings: string[];
}

export class DocumentError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Heuristic Indonesian-language detector. Returns score 0-1.
const ID_MARKERS = [
  "yang", "dan", "atau", "di", "ke", "dari", "untuk", "pada", "dengan",
  "adalah", "akan", "oleh", "secara", "ini", "itu", "tidak", "dalam",
  "agar", "serta", "karena", "sebagai", "namun", "jika", "maka", "para",
  "pihak", "kontrak", "perjanjian", "sewa", "jual", "beli", "kerja",
  "denda", "wajib", "hak", "kewajiban", "rp", "rupiah", "berdasarkan",
];

export function indonesianScore(text: string): number {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  let hits = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, "");
    if (ID_MARKERS.includes(clean)) hits++;
    else if (/^(ber|mem|men|pen|per|se)/.test(clean) && clean.length > 5) hits += 0.5;
    else if (/(kan|an|i)$/.test(clean) && clean.length > 5) hits += 0.4;
  }
  return Math.min(1, hits / Math.max(15, words.length * 0.08));
}

async function renderPdfPageToPng(
  pdf: any,
  pageNumber: number,
  scale = 2
): Promise<Buffer> {
  // Dynamic import so the native canvas binding only loads for OCR path.
  // Text/digital-PDF analysis works even if canvas is unavailable.
  const { createCanvas } = await import("@napi-rs/canvas");
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  // White background (PDFs are transparent by default)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const canvasFactory = {
    create() {
      return { canvas, context: ctx };
    },
    reset() {},
    destroy() {},
  };
  await page.render({
    canvasContext: ctx,
    viewport,
    canvasFactory: canvasFactory as any,
  } as any).promise;
  return canvas.toBuffer("image/png");
}

/**
 * OCR via MiniMax-M3 multimodal VLM (iamhc.cn endpoint).
 * Reads text from images — works for both scan-PDFs and reconstructed SVG images.
 * API key & endpoint configured via MINIMAX_API_KEY / MINIMAX_BASE_URL env vars.
 */
async function ocrImageWithMinimax(png: Buffer): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || "https://api.iamhc.cn/v1";
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY env var not set — OCR unavailable");
  }
  const b64 = png.toString("base64");
  const dataUrl = `data:image/png;base64,${b64}`;
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "MiniMax-M3",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Baca SEMUA teks dari gambar halaman kontrak berbahasa Indonesia ini. Transkripsi apa adanya, pertahankan struktur paragraf dan penomoran pasal. Output HANYA teks hasil transkripsi, tanpa komentar atau penjelasan tambahan.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(120_000), // 2min timeout — external API
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MiniMax API ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : JSON.stringify(content || "");
}

/**
 * Reconstruct a PDF page as a PNG image via SVG (sharp-rendered).
 * This bypasses @napi-rs/canvas glyph rendering issues — sharp renders clean text
 * that VLM/OCR can read reliably. Only works for pages with a text layer (digital PDFs).
 */
async function pdfPageToPngViaSvg(pdf: any, pageNumber: number, scale = 1.5): Promise<Buffer> {
  const page = await pdf.getPage(pageNumber);
  const vp = page.getViewport({ scale });
  const content = await page.getTextContent();
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vp.width}" height="${vp.height}" viewBox="0 0 ${vp.width} ${vp.height}">`;
  svg += `<rect width="${vp.width}" height="${vp.height}" fill="white"/>`;
  for (const item of content.items) {
    if (!item.str) continue;
    const tr = item.transform;
    const x = tr[4] * scale;
    const y = vp.height - tr[5] * scale;
    const fontSize = Math.hypot(tr[2], tr[3]) * scale;
    const escaped = item.str.replace(/</g, "&lt;").replace(/&/g, "&amp;");
    svg += `<text x="${x}" y="${y}" font-family="Helvetica,Arial,sans-serif" font-size="${fontSize}" fill="black">${escaped}</text>`;
  }
  svg += `</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function ocrPdf(pdf: any, maxPages = 6): Promise<string> {
  const pages = Math.min(pdf.numPages, maxPages);
  let fullText = "";
  for (let i = 1; i <= pages; i++) {
    try {
      let png: Buffer;
      // Try SVG reconstruction first (works for digital PDFs with text layer).
      // Falls back to canvas render for scan PDFs (image-only).
      const content = await (await pdf.getPage(i)).getTextContent();
      const hasTextLayer = content.items.some((it: any) => it.str && it.str.trim().length > 0);

      if (hasTextLayer) {
        logger("info", "ocr via svg reconstruction", { page: i });
        png = await pdfPageToPngViaSvg(pdf, i, 1.5);
      } else {
        logger("info", "ocr via canvas render (scan)", { page: i });
        png = await renderPdfPageToPng(pdf, i, 2);
      }

      const pageText = await ocrImageWithMinimax(png);
      fullText += pageText + "\n\n";
    } catch (e) {
      logger("warn", "ocr page failed", { page: i, error: (e as Error).message });
    }
  }
  return fullText.trim();
}

async function extractDocxText(data: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: data });
  return (result.value || "").trim();
}

export async function parsePdf(
  data: Uint8Array,
  fileName?: string
): Promise<ParsedDocument> {
  const warnings: string[] = [];
  // Open the PDF document ONCE and reuse the handle for text extraction + OCR.
  // Previously this opened the doc up to 3× (text extract, OCR getDocument,
  // per-page render getDocument) which was wasteful for multi-page scans.
  const pdf = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const numPages = pdf.numPages;

  let text = "";
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: any) => ("str" in it ? it.str : ""))
      .join(" ");
    text += pageText + "\n\n";
  }
  text = text.trim();
  let ocrUsed = false;

  // Heuristic: if extracted text is too sparse relative to page count, try OCR.
  const meaningful = text.replace(/\s/g, "").length;
  logger("info", "pdf text extraction result", { numPages, meaningful, threshold: 40 * numPages });
  if (meaningful < 40 * numPages) {
    warnings.push(
      "Teks pada PDF sedikit/tidak terbaca (kemungkinan hasil scan/foto). Mencoba OCR otomatis..."
    );
    try {
      const ocrText = await ocrPdf(pdf, 6);
      logger("info", "ocr completed", { ocrLen: ocrText.replace(/\s/g, "").length, prevLen: meaningful });
      if (ocrText.replace(/\s/g, "").length > meaningful) {
        text = ocrText;
        ocrUsed = true;
      } else {
        warnings.push("OCR tidak menemukan teks lebih banyak. Hasil mungkin tidak optimal.");
      }
    } catch (e) {
      warnings.push(
        "OCR otomatis gagal. Coba unggah ulang dengan kualitas scan lebih baik, atau salin teks manual."
      );
      logger("error", "ocr failed", { error: (e as Error).message });
    }
  }

  if (!text || text.replace(/\s/g, "").length < 30) {
    throw new DocumentError(
      "EMPTY",
      "Tidak ada teks yang bisa dibaca dari PDF ini. Pastikan file tidak rusak dan berisi teks (bukan gambar kosong)."
    );
  }

  return { text, sourceType: "PDF", fileName, ocrUsed, warnings };
}

export async function parseDocx(
  data: Buffer,
  fileName?: string
): Promise<ParsedDocument> {
  const text = await extractDocxText(data);
  if (!text || text.replace(/\s/g, "").length < 30) {
    throw new DocumentError(
      "EMPTY",
      "Tidak ada teks yang bisa dibaca dari DOCX ini. Pastikan file tidak kosong atau rusak."
    );
  }
  return { text, sourceType: "DOCX", fileName, ocrUsed: false, warnings: [] };
}

export function validateContractText(
  text: string,
  warnings: string[]
): { ok: boolean; error?: string } {
  const meaningful = text.replace(/\s/g, "").length;
  if (meaningful < 60) {
    return {
      ok: false,
      error:
        "Teks kontrak terlalu pendek atau kosong. Pastikan Anda mengunggah dokumen kontrak yang utuh.",
    };
  }
  const score = indonesianScore(text);
  if (score < 0.04) {
    warnings.push(
      "Bahasa pada dokumen sepertinya bukan Bahasa Indonesia. Analisis tetap dilakukan, namun hasil mungkin kurang akurat."
    );
  }
  return { ok: true };
}
