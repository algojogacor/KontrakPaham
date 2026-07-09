/**
 * auto-fix-ids.mjs
 * Automatically discovers correct BPK JDIH Details IDs for failed/mismatched documents.
 * Queries BPK search, extracts candidate IDs, verifies by title match, then patches sources.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SLEEP_MS = 1500; // Be polite to BPK servers
const BPK_BASE = "https://peraturan.bpk.go.id";
const RAW_DIR = join("data", "legal-raw");
const SOURCES_PATH = join("data", "legal-sources.json");
const DISCOVER_SCRIPT = join("scripts", "legal-scrape", "discover-sources.mjs");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "KontrakPaham-LegalResearch/1.0 (+https://kontrakpaham.id)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.text();
}

/**
 * Build a BPK-friendly search keyword from a document descriptor.
 * E.g. { type: "UU", number: "11", year: 2008 } => "UU 11 2008"
 *      { type: "PP", number: "44", year: 1994 } => "PP 44 1994"
 *      { type: "KUHPerdata" } => "Kitab Undang-Undang Hukum Perdata"
 */
function buildSearchKeyword(doc) {
  if (doc.number && doc.year && doc.type && doc.type !== "KUHPerdata") {
    return `${doc.type} ${doc.number} Tahun ${doc.year}`;
  }
  // Fallback: use first 5 words of title
  return doc.title.split(" ").slice(0, 5).join(" ");
}

/**
 * Extract all unique Details IDs from a BPK search result HTML page.
 */
function extractDetailIds(html) {
  const ids = new Set();
  const re = /\/Details\/(\d+)\//g;
  let m;
  while ((m = re.exec(html)) !== null) {
    ids.add(parseInt(m[1], 10));
  }
  return [...ids];
}

/**
 * Title characteristic check: does the BPK page title match the expected doc?
 * Returns true if title contains enough identifying tokens.
 */
function titleMatches(pageTitle, doc) {
  const t = pageTitle.toLowerCase();
  // Must NOT be a local reg (Perbup / Perwali / Perda / Pergub)
  if (/perbup|perwali|perda|pergub|perbupati|perwalikota/.test(t)) return false;

  const type = (doc.type || "").toLowerCase();
  const number = doc.number?.toString() ?? "";
  const year = doc.year?.toString() ?? "";

  if (type === "kuhperdata") {
    return t.includes("hukum perdata") || t.includes("kuhperdata") || t.includes("burgerlijk wetboek");
  }

  // Match type
  const typeMatch =
    (type === "uu" && (t.includes("undang-undang") || t.includes(" uu "))) ||
    (type === "pp" && (t.includes("peraturan pemerintah") || t.includes(" pp "))) ||
    (type === "perppu" && t.includes("peraturan pemerintah pengganti")) ||
    t.includes(type);

  if (!typeMatch) return false;
  if (number && !t.includes("nomor " + number) && !t.includes("no. " + number) && !t.includes("no " + number)) return false;
  if (year && !t.includes(year)) return false;

  return true;
}

/**
 * Search BPK for a document and return the verified Details URL.
 */
async function findBpkDetailsUrl(doc, maxPages = 5) {
  const keyword = buildSearchKeyword(doc);
  console.log(`  🔍 Searching BPK for: "${keyword}"`);

  const candidates = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const searchUrl = `${BPK_BASE}/Search?Keyword=${encodeURIComponent(keyword)}&p=${page}`;
    let html;
    try {
      html = await fetchText(searchUrl);
    } catch (e) {
      console.warn(`    Warning: search page ${page} failed: ${e.message}`);
      break;
    }

    const ids = extractDetailIds(html);
    for (const id of ids) candidates.add(id);

    // If the page has no Details links at all, stop paginating
    if (ids.length === 0) break;
    await sleep(SLEEP_MS);
  }

  console.log(`  Found ${candidates.size} candidate IDs. Verifying...`);

  // Sort candidates descending (newer IDs tend to be more authoritative)
  const sorted = [...candidates].sort((a, b) => b - a);

  // Build slug from type + number + year
  const slug = doc.number
    ? `${doc.type?.toLowerCase()}-no-${doc.number}-tahun-${doc.year}`
    : "kuhperdata";

  for (const id of sorted) {
    const detailUrl = `${BPK_BASE}/Details/${id}/${slug}`;
    let html;
    try {
      html = await fetchText(detailUrl);
    } catch {
      continue;
    }

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : "";

    if (titleMatches(pageTitle, doc)) {
      console.log(`  ✅ Found: ID=${id}, Title="${pageTitle}"`);
      return { id, url: detailUrl };
    }
    await sleep(400);
  }

  console.log(`  ❌ Could not verify any candidate for: ${doc.title}`);
  return null;
}

/**
 * Identify which documents in legal-sources.json are "broken" (have no cached PDF).
 */
function findBrokenDocs(sourcesMapping) {
  const cachedFiles = existsSync(RAW_DIR)
    ? new Set(readdirSync(RAW_DIR).filter((f) => f.endsWith(".pdf")))
    : new Set();

  const broken = [];
  const seen = new Set();

  for (const [family, docs] of Object.entries(sourcesMapping)) {
    for (const doc of docs) {
      if (seen.has(doc.title)) continue;
      seen.add(doc.title);

      // Check if there's a cached JSON for this doc
      const jsonFiles = existsSync(RAW_DIR)
        ? readdirSync(RAW_DIR).filter((f) => f.endsWith(".json"))
        : [];

      let hasCachedPdf = false;
      for (const jf of jsonFiles) {
        try {
          const meta = JSON.parse(readFileSync(join(RAW_DIR, jf), "utf8"));
          if (meta.title === doc.title) {
            const pdfPath = jf.replace(".json", ".pdf");
            if (cachedFiles.has(pdfPath)) {
              hasCachedPdf = true;
            }
            break;
          }
        } catch {
          // ignore
        }
      }

      if (!hasCachedPdf) {
        broken.push({ ...doc, family });
      }
    }
  }

  return broken;
}

/**
 * Patch discover-sources.mjs: replace the old wrong sourceUrl with the correct one.
 */
function patchDiscoverSources(oldUrl, newUrl) {
  if (!existsSync(DISCOVER_SCRIPT)) return;
  const content = readFileSync(DISCOVER_SCRIPT, "utf8");
  const patched = content.replaceAll(JSON.stringify(oldUrl), JSON.stringify(newUrl));
  if (patched !== content) {
    writeFileSync(DISCOVER_SCRIPT, patched, "utf8");
    console.log(`  📝 Patched discover-sources.mjs: ${oldUrl} → ${newUrl}`);
  }
}

/**
 * Patch data/legal-sources.json: replace old URL with new URL.
 */
function patchLegalSources(sourcesMapping, docTitle, newUrl) {
  let changed = false;
  for (const docs of Object.values(sourcesMapping)) {
    for (const doc of docs) {
      if (doc.title === docTitle && doc.sourceUrl !== newUrl) {
        doc.sourceUrl = newUrl;
        changed = true;
      }
    }
  }
  if (changed) {
    writeFileSync(SOURCES_PATH, JSON.stringify(sourcesMapping, null, 2), "utf8");
    console.log(`  💾 Updated legal-sources.json for: ${docTitle}`);
  }
}

async function main() {
  if (!existsSync(SOURCES_PATH)) {
    console.error("data/legal-sources.json not found. Run discover-sources first.");
    process.exit(1);
  }

  const sourcesMapping = JSON.parse(readFileSync(SOURCES_PATH, "utf8"));
  const brokenDocs = findBrokenDocs(sourcesMapping);

  if (brokenDocs.length === 0) {
    console.log("✅ All documents are cached. No broken IDs to fix.");
    return;
  }

  console.log(`\n🔧 Found ${brokenDocs.length} broken/missing document(s):\n`);
  brokenDocs.forEach((d) => console.log(`  - [${d.family}] ${d.title}`));
  console.log();

  const fixes = [];

  for (const doc of brokenDocs) {
    console.log(`\n━━━ Processing: ${doc.title} ━━━`);
    const result = await findBpkDetailsUrl(doc);

    if (result) {
      const oldUrl = doc.sourceUrl;
      const newUrl = result.url;

      if (oldUrl !== newUrl) {
        patchDiscoverSources(oldUrl, newUrl);
        patchLegalSources(sourcesMapping, doc.title, newUrl);
        fixes.push({ title: doc.title, oldUrl, newUrl });
      } else {
        console.log(`  ℹ️  URL unchanged for: ${doc.title}`);
      }
    } else {
      console.warn(`  ⚠️  Skipping (no valid ID found): ${doc.title}`);
    }

    await sleep(SLEEP_MS);
  }

  console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Auto-fix complete. ${fixes.length} URL(s) corrected:`);
  for (const f of fixes) {
    console.log(`\n  ${f.title}`);
    console.log(`    OLD: ${f.oldUrl}`);
    console.log(`    NEW: ${f.newUrl}`);
  }

  if (fixes.length > 0) {
    console.log("\n✅ Now run fetch-documents.mjs again to download the fixed documents.");
  }
}

await main();
