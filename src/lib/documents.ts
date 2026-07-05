import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createRequire } from "module";
import mammoth from "mammoth";
import ZAI from "z-ai-web-dev-sdk";
import { logger } from "@/lib/logger";

const require = createRequire(import.meta.url);
pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
  "pdfjs-dist/legacy/build/pdf.worker.mjs"
);

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

async function extractPdfText(
  data: Uint8Array
): Promise<{ text: string; numPages: number }> {
  const loadingTask = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: any) => ("str" in it ? it.str : ""))
      .join(" ");
    text += pageText + "\n\n";
  }
  return { text: text.trim(), numPages: pdf.numPages };
}

async function renderPdfPageToPng(
  data: Uint8Array,
  pageNumber: number,
  scale = 2
): Promise<Buffer> {
  // Dynamic import so the native canvas binding only loads for OCR path.
  // Text/digital-PDF analysis works even if canvas is unavailable.
  const { createCanvas } = await import("@napi-rs/canvas");
  const pdf = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
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

async function ocrPdf(data: Uint8Array, maxPages = 6): Promise<string> {
  const zai = await ZAI.create();
  const pdf = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;
  const pages = Math.min(pdf.numPages, maxPages);
  let fullText = "";
  for (let i = 1; i <= pages; i++) {
    try {
      const png = await renderPdfPageToPng(data, i, 2);
      const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
      const completion = await zai.chat.completions.createVision({
        model: "glm-4.5v",
        messages: [
          {
            role: "system",
            content:
              "Anda adalah mesin OCR untuk dokumen hukum berbahasa Indonesia. " +
              "Transkripsi SELURUH teks yang terlihat pada gambar halaman secara akurat dan apa adanya. " +
              "Pertahankan struktur paragraf dan penomoran. Jangan tambahkan komentar. " +
              "Jika ada bagian tidak terbaca, tulis [tidak terbaca]. Hanya keluarkan teks hasil transkripsi.",
          },
          {
            role: "user",
            content: [{ type: "text", text: "Transkripsi teks pada halaman ini." }, { type: "image_url", image_url: { url: dataUrl } }],
          },
        ],
        thinking: { type: "disabled" },
      });
      const out = completion?.choices?.[0]?.message?.content ?? "";
      fullText += (typeof out === "string" ? out : JSON.stringify(out)) + "\n\n";
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
  let { text, numPages } = await extractPdfText(data);
  let ocrUsed = false;

  // Heuristic: if extracted text is too sparse relative to page count, try OCR.
  const meaningful = text.replace(/\s/g, "").length;
  if (meaningful < 40 * numPages) {
    warnings.push(
      "Teks pada PDF sedikit/tidak terbaca (kemungkinan hasil scan/foto). Mencoba OCR otomatis..."
    );
    try {
      const ocrText = await ocrPdf(data, 6);
      if (ocrText.replace(/\s/g, "").length > meaningful) {
        text = ocrText;
        ocrUsed = true;
      } else {
        warnings.push("OCR tidak menemukan teks lebih banyak. Hasik mungkin tidak optimal.");
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
