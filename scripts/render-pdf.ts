import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

// Minimal PDF to PNG rendering using pdfjs-dist
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

(globalThis as any).pdfjsWorker = pdfjsWorker;

async function renderFirstPage() {
  const pdfPath = join(process.cwd(), "public", "brand", "preview-logo.pdf");
  const data = new Uint8Array(readFileSync(pdfPath));

  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");

  // White background (PDFs are transparent by default)
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const canvasFactory = {
    create() {
      return { canvas, context };
    },
    reset() {},
    destroy() {},
  };

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvasFactory: canvasFactory,
  };

  await page.render(renderContext as any).promise;

  const pngBuffer = canvas.toBuffer("image/png");
  writeFileSync("public/brand/preview-logo.png", pngBuffer);
  console.log("SUCCESS: Rendered first page to public/brand/preview-logo.png");
}

renderFirstPage().catch((err) => {
  console.error("Failed to render PDF to PNG:", err);
});
