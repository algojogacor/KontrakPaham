import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "crypto";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getHash(data) {
  return createHash("sha256").update(data).digest("hex");
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "KontrakPaham-Scraper/1.0" },
        ...options
      });
      if (res.status >= 200 && res.status < 300) return res;
      console.warn(`[HTTP ${res.status}] Retrying ${url} (${i + 1}/${retries})...`);
    } catch (err) {
      console.warn(`[Network Error] ${err.message}. Retrying ${url} (${i + 1}/${retries})...`);
    }
    await sleep(2000);
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries.`);
}

async function downloadDocument(doc) {
  const docId = createHash("sha256").update(doc.title).digest("hex").slice(0, 24);
  const metaPath = join("data", "legal-raw", `${docId}.json`);
  const pdfPath = join("data", "legal-raw", `${docId}.pdf`);

  // Idempotency: Skip if already fetched and metadata exists
  if (existsSync(metaPath) && existsSync(pdfPath)) {
    console.log(`[Cache Hit] Already fetched: ${doc.title}`);
    return;
  }

  console.log(`[Fetch] Processing details page: ${doc.sourceUrl}`);
  const detailsRes = await fetchWithRetry(doc.sourceUrl);
  const html = await detailsRes.text();

  // 1. Validation: Verify that the BPK page title matches target regulation characteristics
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";
  if (doc.type && doc.type !== "KUHPerdata") {
    const cleanType = doc.type.toLowerCase();
    const cleanNumber = doc.number ? doc.number.toString() : "";
    const cleanYear = doc.year ? doc.year.toString() : "";
    const lowerTitle = pageTitle.toLowerCase();
    
    const isMatching = lowerTitle.includes(cleanType) && 
                       (!cleanNumber || lowerTitle.includes(cleanNumber)) && 
                       (!cleanYear || lowerTitle.includes(cleanYear));
    if (!isMatching) {
      throw new Error(`BPK Page Title mismatch! Expected to find characteristics of "${doc.type} ${doc.number || ""} ${doc.year || ""}" in title, but got "${pageTitle}"`);
    }
  }

  // 2. Parse legalStatus & amendedBy relationship
  let legalStatus = "ACTIVE";
  let amendedBy = null;
  const htmlLower = html.toLowerCase();
  
  if (htmlLower.includes("dicabut oleh") || htmlLower.includes("tidak berlaku") || htmlLower.includes("status: dicabut")) {
    legalStatus = "REVOKED";
  } else if (htmlLower.includes("diubah oleh") || htmlLower.includes("status: diubah")) {
    legalStatus = "AMENDED";
    const amendedMatch = html.match(/(?:diubah oleh|status: diubah oleh)[^<>]*?<a[^>]*?>([^<>]+)<\/a>/i) ||
                         html.match(/(?:diubah oleh|status: diubah oleh)\s*:\s*([^<>,\n\r]+)/i);
    if (amendedMatch) {
      amendedBy = amendedMatch[1].replace(/\s+/g, " ").trim();
    }
  }
  
  if (legalStatus === "ACTIVE" && (htmlLower.includes("dicabut") || htmlLower.includes("diubah") || htmlLower.includes("mencabut"))) {
    legalStatus = "NEEDS_VERIFICATION";
  }

  // 3. Find PDF download link in BPK Details page HTML
  const downloadMatch = html.match(/href="(\/Download\/[^"]+)"/);
  if (!downloadMatch) {
    throw new Error(`No download PDF link found on page: ${doc.sourceUrl}`);
  }

  const downloadUrl = `https://peraturan.bpk.go.id${downloadMatch[1]}`;
  console.log(`[Fetch] Downloading PDF from: ${downloadUrl}`);
  
  // Wait to respect rate-limit
  await sleep(3000);

  const pdfRes = await fetchWithRetry(downloadUrl);
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  const contentHash = getHash(pdfBuffer);

  // Write files
  writeFileSync(pdfPath, pdfBuffer);
  
  const metadata = {
    id: docId,
    title: doc.title,
    type: doc.type,
    number: doc.number || null,
    year: doc.year || null,
    jurisdiction: doc.jurisdiction,
    sourceUrl: doc.sourceUrl,
    downloadUrl,
    fetchTimestamp: new Date().toISOString(),
    contentHash,
    legalStatus,
    amendedBy
  };
  
  writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf8");
  console.log(`[Success] Saved: ${doc.title} (Status: ${legalStatus}, Hash: ${contentHash.slice(0, 8)})`);
}

async function main() {
  const sourcesPath = join("data", "legal-sources.json");
  if (!existsSync(sourcesPath)) {
    console.error("Sources file not found. Run discover-sources first.");
    process.exit(1);
  }

  const sourcesMapping = JSON.parse(readFileSync(sourcesPath, "utf8"));
  
  // Flatten unique documents to fetch
  const docMap = new Map();
  for (const docs of Object.values(sourcesMapping)) {
    for (const doc of docs) {
      docMap.set(doc.title, doc);
    }
  }
  const uniqueDocs = [...docMap.values()];
  
  console.log(`Found ${uniqueDocs.length} unique documents to fetch.`);
  mkdirSync(join("data", "legal-raw"), { recursive: true });

  for (let i = 0; i < uniqueDocs.length; i++) {
    const doc = uniqueDocs[i];
    console.log(`\n[${i + 1}/${uniqueDocs.length}] Starting fetch for: ${doc.title}`);
    try {
      await downloadDocument(doc);
      // Wait between document details page requests
      await sleep(3000);
    } catch (err) {
      console.error(`[Error] Failed to fetch: ${doc.title}. Reason: ${err.message}`);
    }
  }
  console.log("\nDocument fetch phase complete.");
}

await main();
