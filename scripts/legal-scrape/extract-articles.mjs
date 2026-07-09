import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { LEGAL_TAG_DEFINITIONS } from "../../src/lib/legal-taxonomy.ts";

globalThis.pdfjsWorker = pdfjsWorker;

const prisma = new PrismaClient();

export function normalizeLegalSearchText(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTitle(line) {
  if (line.length > 60) return false;
  if (/[.,;:?]$/.test(line)) return false;
  
  const lowercaseWords = ["adalah", "yang", "dan", "dilarang", "wajib", "dalam", "untuk", "dengan", "atau", "atas", "sebagaimana", "dimaksud", "sebagai", "jika", "apabila", "oleh"];
  const tokens = line.toLowerCase().split(/\s+/);
  if (tokens.some(t => lowercaseWords.includes(t))) return false;
  return true;
}

export function parseArticles(text) {
  const regex = /(?:^|\r?\n)\s*(Pasal\s+\d+[A-Za-z]*)(?:\s|\r?\n|$)/gi;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      number: match[1].replace(/\s+/g, " ").trim(),
      length: match[0].length
    });
  }

  const articles = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    
    const rawArticleText = text.slice(current.index + current.length, nextIndex).trim();
    const lines = rawArticleText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let title = null;
    let articleText = rawArticleText;
    
    if (lines.length > 1) {
      const firstLine = lines[0];
      if (isTitle(firstLine) && !firstLine.startsWith("(") && !/^\d+\./.test(firstLine)) {
        title = firstLine;
        articleText = lines.slice(1).join("\n");
      }
    }

    articles.push({
      articleNumber: current.number,
      title,
      text: articleText.trim()
    });
  }
  return articles;
}

async function extractPdfText(data) {
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
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    text += pageText + "\n\n";
  }
  return text.trim();
}

function getTagFamiliesForDoc(sourcesMapping, docTitle) {
  const families = [];
  for (const [family, docs] of Object.entries(sourcesMapping)) {
    if (docs.some(d => d.title === docTitle)) {
      families.push(family);
    }
  }
  return families;
}

export function tagArticle(articleText, docFamilies) {
  const matchedTags = [];
  const normalizedText = normalizeLegalSearchText(articleText);
  
  for (const definition of LEGAL_TAG_DEFINITIONS) {
    if (docFamilies.includes(definition.family)) {
      for (const alias of definition.aliases) {
        const normalizedAlias = normalizeLegalSearchText(alias);
        if (normalizedText.includes(normalizedAlias)) {
          matchedTags.push(definition.tag);
          break;
        }
      }
    }
  }
  
  if (matchedTags.length === 0) {
    for (const definition of LEGAL_TAG_DEFINITIONS) {
      if (!docFamilies.includes(definition.family)) {
        for (const alias of definition.aliases) {
          const normalizedAlias = normalizeLegalSearchText(alias);
          if (normalizedText.includes(normalizedAlias)) {
            matchedTags.push(definition.tag);
            break;
          }
        }
      }
    }
  }
  
  if (matchedTags.length === 0 && docFamilies.length > 0) {
    matchedTags.push(docFamilies[0]);
  }
  
  return [...new Set(matchedTags)];
}

async function processDocument(metaFile, rawDir, sourcesMapping) {
  const meta = JSON.parse(readFileSync(join(rawDir, metaFile), "utf8"));
  const pdfFile = metaFile.replace(".json", ".pdf");
  const pdfPath = join(rawDir, pdfFile);
  
  if (!existsSync(pdfPath)) {
    throw new Error(`PDF file not found for metadata: ${metaFile}`);
  }

  console.log(`\n--- Parsing: ${meta.title} ---`);
  const pdfBuffer = readFileSync(pdfPath);
  const text = await extractPdfText(new Uint8Array(pdfBuffer));
  
  if (text.length < 100) {
    return {
      success: false,
      reason: "scanned_pdf_or_no_text",
      details: `Parsed text only has ${text.length} characters (likely scanned PDF or empty).`
    };
  }

  const parsed = parseArticles(text);
  console.log(`Extracted ${parsed.length} raw articles.`);

  if (parsed.length === 0) {
    return {
      success: false,
      reason: "zero_articles_extracted",
      details: "Could not find any 'Pasal' headings in the text."
    };
  }

  // 1. Structure cross-check (discrepancy > 10%)
  let maxNumber = 0;
  for (const art of parsed) {
    const numMatch = art.articleNumber.match(/Pasal\s+(\d+)/i);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  }

  const discrepancy = Math.abs(maxNumber - parsed.length) / maxNumber;
  if (discrepancy > 0.1) {
    return {
      success: false,
      reason: "structure_discrepancy",
      details: `Article count discrepancy too high. Max article number: ${maxNumber}, Extracted: ${parsed.length} (Discrepancy: ${(discrepancy * 100).toFixed(1)}%)`,
      articles: parsed,
      meta
    };
  }

  // 2. Map tag families
  const docFamilies = getTagFamiliesForDoc(sourcesMapping, meta.title);

  // 3. Upsert LegalDocument
  const host = meta.sourceUrl ? new URL(meta.sourceUrl).host : "peraturan.bpk.go.id";
  const docRecord = await prisma.legalDocument.upsert({
    where: { id: meta.id },
    update: {
      title: meta.title,
      type: meta.type,
      number: meta.number ? meta.number.toString() : null,
      year: meta.year,
      sourceUrl: meta.sourceUrl,
      sourceHost: host,
      contentHash: meta.contentHash,
      legalStatus: meta.legalStatus,
      amendedBy: meta.amendedBy
    },
    create: {
      id: meta.id,
      title: meta.title,
      type: meta.type,
      number: meta.number ? meta.number.toString() : null,
      year: meta.year,
      sourceUrl: meta.sourceUrl,
      sourceHost: host,
      contentHash: meta.contentHash,
      legalStatus: meta.legalStatus,
      amendedBy: meta.amendedBy
    }
  });

  // 4. Save articles
  let successCount = 0;
  let skippedCount = 0;

  for (const art of parsed) {
    // Article-level validation gate
    const cleanText = art.text.trim();
    const cleanNumber = art.articleNumber.trim();
    
    if (cleanText.length < 20) {
      // Quarantine single invalid article
      const contentHash = createHash("sha256").update(docRecord.id + cleanNumber + cleanText).digest("hex");
      await prisma.legalArticleQuarantine.upsert({
        where: { contentHash },
        update: {
          documentId: docRecord.id,
          articleNumber: cleanNumber,
          title: art.title,
          text: cleanText,
          plainSummary: "",
          tags: JSON.stringify([docFamilies[0]]),
          normalizedText: normalizeLegalSearchText(cleanText),
          sourceUrl: meta.sourceUrl,
          quarantineReason: "article_too_short"
        },
        create: {
          documentId: docRecord.id,
          articleNumber: cleanNumber,
          title: art.title,
          text: cleanText,
          plainSummary: "",
          tags: JSON.stringify([docFamilies[0]]),
          normalizedText: normalizeLegalSearchText(cleanText),
          sourceUrl: meta.sourceUrl,
          contentHash,
          quarantineReason: "article_too_short"
        }
      });
      skippedCount++;
      continue;
    }

    const tags = tagArticle(cleanText, docFamilies);
    const contentHash = createHash("sha256").update(docRecord.id + cleanNumber + cleanText).digest("hex");
    const normalizedText = normalizeLegalSearchText(`${cleanNumber} ${art.title || ""} ${cleanText} ${tags.join(" ")}`);

    await prisma.legalArticle.upsert({
      where: { contentHash },
      update: {
        documentId: docRecord.id,
        articleNumber: cleanNumber,
        title: art.title,
        text: cleanText,
        tags: JSON.stringify(tags),
        normalizedText,
        sourceUrl: meta.sourceUrl
      },
      create: {
        documentId: docRecord.id,
        articleNumber: cleanNumber,
        title: art.title,
        text: cleanText,
        tags: JSON.stringify(tags),
        normalizedText,
        sourceUrl: meta.sourceUrl,
        contentHash
      }
    });
    successCount++;
  }

  console.log(`Saved ${successCount} articles to LegalArticle, quarantined ${skippedCount} items.`);
  return { success: true, count: successCount };
}

async function handleQuarantine(quarantinedDoc, reason) {
  const { meta, articles, details } = quarantinedDoc;
  console.warn(`[Quarantine] Document quarantined: "${meta.title}". Reason: ${reason}. Details: ${details}`);
  
  // Upsert LegalDocument
  const host = meta.sourceUrl ? new URL(meta.sourceUrl).host : "peraturan.bpk.go.id";
  const docRecord = await prisma.legalDocument.upsert({
    where: { id: meta.id },
    update: {
      title: meta.title,
      type: meta.type,
      number: meta.number ? meta.number.toString() : null,
      year: meta.year,
      sourceUrl: meta.sourceUrl,
      sourceHost: host,
      contentHash: meta.contentHash,
      legalStatus: meta.legalStatus || "NEEDS_VERIFICATION",
      amendedBy: meta.amendedBy
    },
    create: {
      id: meta.id,
      title: meta.title,
      type: meta.type,
      number: meta.number ? meta.number.toString() : null,
      year: meta.year,
      sourceUrl: meta.sourceUrl,
      sourceHost: host,
      contentHash: meta.contentHash,
      legalStatus: meta.legalStatus || "NEEDS_VERIFICATION",
      amendedBy: meta.amendedBy
    }
  });

  // Save all articles to quarantine table
  for (const art of articles) {
    const cleanText = art.text.trim();
    const cleanNumber = art.articleNumber.trim();
    const contentHash = createHash("sha256").update(docRecord.id + cleanNumber + cleanText).digest("hex");
    
    await prisma.legalArticleQuarantine.upsert({
      where: { contentHash },
      update: {
        documentId: docRecord.id,
        articleNumber: cleanNumber,
        title: art.title,
        text: cleanText,
        tags: JSON.stringify([]),
        normalizedText: normalizeLegalSearchText(cleanText),
        sourceUrl: meta.sourceUrl,
        quarantineReason: reason
      },
      create: {
        documentId: docRecord.id,
        articleNumber: cleanNumber,
        title: art.title,
        text: cleanText,
        tags: JSON.stringify([]),
        normalizedText: normalizeLegalSearchText(cleanText),
        sourceUrl: meta.sourceUrl,
        contentHash,
        quarantineReason: reason
      }
    });
  }
  console.log(`Saved ${articles.length} articles to LegalArticleQuarantine.`);
}

async function main() {
  const rawDir = join("data", "legal-raw");
  if (!existsSync(rawDir)) {
    console.error("No legal-raw cache folder found. Run fetch-documents first.");
    process.exit(1);
  }

  const sourcesPath = join("data", "legal-sources.json");
  if (!existsSync(sourcesPath)) {
    console.error("Sources file not found.");
    process.exit(1);
  }
  const sourcesMapping = JSON.parse(readFileSync(sourcesPath, "utf8"));

  const files = readdirSync(rawDir).filter(f => f.endsWith(".json"));
  console.log(`Processing ${files.length} downloaded documents...`);

  let parsedCount = 0;
  let quarantineCount = 0;

  for (const file of files) {
    try {
      const result = await processDocument(file, rawDir, sourcesMapping);
      if (result.success) {
        parsedCount++;
      } else {
        quarantineCount++;
        // Save the whole document to quarantine
        if (result.articles) {
          await handleQuarantine(result, result.reason);
        } else {
          console.warn(`[Skipped/Quarantine Warning] Document skipped: ${file}. Reason: ${result.reason}`);
        }
      }
    } catch (err) {
      console.error(`[Fatal Error] Failed to process document ${file}:`, err.message);
    }
  }

  console.log(`\nProcessing summary:`);
  console.log(`- Documents successfully parsed: ${parsedCount}`);
  console.log(`- Documents sent to quarantine: ${quarantineCount}`);
  
  if (prisma.$disconnect) {
    await prisma.$disconnect();
  }
}

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

const isMain = () => {
  try {
    if (import.meta.main) return true;
    if (!process.argv[1]) return false;
    const mainPath = realpathSync(process.argv[1]);
    const modulePath = realpathSync(fileURLToPath(import.meta.url));
    return mainPath === modulePath;
  } catch {
    return false;
  }
};

if (isMain()) {
  await main();
}
