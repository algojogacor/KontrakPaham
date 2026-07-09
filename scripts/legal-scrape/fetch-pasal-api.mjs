/**
 * fetch-pasal-api.mjs
 *
 * Mengambil artikel hukum dari pasal.id REST API untuk semua tag family.
 * Menggunakan token pool 4 token (round-robin) → efektif 4× rate limit.
 *
 * Rate limit per token: 60 req/60s (laws/{frbr_uri})
 * Dengan 4 token + round-robin: ~240 req/60s → ~250ms gap per request cukup aman.
 */

import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

// ── Load .env manual (kompatibel dengan Node.js bare script) ─────────────────
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

// ── Token pool ────────────────────────────────────────────────────────────────
const TOKEN_POOL = [
  process.env.PASAL_API_TOKEN,
  process.env.PASAL_API_TOKEN_2,
  process.env.PASAL_API_TOKEN_3,
  process.env.PASAL_API_TOKEN_4,
].filter(Boolean);

if (TOKEN_POOL.length === 0) {
  console.error("Tidak ada PASAL_API_TOKEN di .env");
  process.exit(1);
}
console.log(`🔑 Token pool: ${TOKEN_POOL.length} token aktif`);

let tokenIndex = 0;
function nextToken() {
  const t = TOKEN_POOL[tokenIndex % TOKEN_POOL.length];
  tokenIndex++;
  return t;
}

// ── Prisma + LibSQL (Turso) ───────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma =
  process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
    ? new PrismaClient({
        adapter: new PrismaLibSql({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        }),
      })
    : new PrismaClient();

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = "https://pasal.id/api/v1";
const SOURCES_PATH = join("data", "legal-sources.json");
const WORKLOG_PATH = "worklog.md";

// Gap antar request: dengan 4 token, tiap token dapat jeda 4× lebih besar.
// 60 req/60s per token → 1 req/s per token → 4 token = 4 req/s total → 250ms gap.
const GAP_MS = 300;

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiGet(path, retries = 2) {
  const token = nextToken();
  const url = `${API_BASE}${path}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (resp.status === 429) {
    console.warn(`  ⚠️  429 Rate limited — menunggu 15s...`);
    await sleep(15000);
    if (retries > 0) return apiGet(path, retries - 1);
    throw new Error(`Rate limit persists for ${url}`);
  }

  if (resp.status === 404) {
    throw new Error(`404:${url}`);
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${body.slice(0, 120)}`);
  }

  return resp.json();
}

// ── FRBR URI builder ──────────────────────────────────────────────────────────
const TYPE_SLUG = {
  UU: "uu",
  PP: "pp",
  PERPPU: "perppu",
  PERPRES: "perpres",
  PERMEN: "permen",
  POJK: "pojk",
  PBI: "pbi",
  KEPMEN: "kepmen",
};

function buildFrbrUri(doc) {
  const slug = TYPE_SLUG[doc.type?.toUpperCase()];
  if (!slug || !doc.number || !doc.year) return null;
  return `/akn/id/act/${slug}/${doc.year}/${doc.number}`;
}

async function searchFrbrUri(doc) {
  // Use first 4 significant words as query
  const kw = doc.title
    .replace(/^(Kitab|Undang-Undang|Peraturan Pemerintah|Keputusan)\s+/i, "")
    .split(" ")
    .slice(0, 4)
    .join(" ");

  const data = await apiGet(`/search?q=${encodeURIComponent(kw)}&limit=5`);
  await sleep(GAP_MS);

  if (!data.results?.length) return null;

  // Prefer exact type match
  for (const r of data.results) {
    const wt = r.work.type?.toUpperCase();
    if (!doc.type || doc.type === "KUHPerdata" || wt === doc.type?.toUpperCase()) {
      return r.work.frbr_uri;
    }
  }
  return data.results[0]?.work?.frbr_uri ?? null;
}

// ── Text helpers ──────────────────────────────────────────────────────────────
function normText(s) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapStatus(s) {
  switch (s?.toLowerCase()) {
    case "berlaku": return "ACTIVE";
    case "dicabut": return "REVOKED";
    case "diubah":  return "AMENDED";
    default:        return "NEEDS_VERIFICATION";
  }
}

// ── Tag definitions (optional, graceful fallback) ─────────────────────────────
let TAG_DEFS = [];
try {
  const mod = await import("../../src/lib/legal-taxonomy.ts");
  TAG_DEFS = mod.LEGAL_TAG_DEFINITIONS ?? [];
  console.log(`🏷️  Loaded ${TAG_DEFS.length} tag definitions`);
} catch {
  console.warn("⚠️  Could not import legal-taxonomy.ts — will use family name as tag.");
}

function tagArticle(text, docFamilies) {
  const norm = normText(text);
  const hits = new Set();

  for (const def of TAG_DEFS) {
    if (!docFamilies.includes(def.family)) continue;
    for (const alias of def.aliases) {
      if (norm.includes(normText(alias))) { hits.add(def.tag); break; }
    }
  }
  // Cross-family fallback
  if (hits.size === 0) {
    for (const def of TAG_DEFS) {
      for (const alias of def.aliases) {
        if (norm.includes(normText(alias))) { hits.add(def.tag); break; }
      }
    }
  }
  if (hits.size === 0 && docFamilies.length > 0) hits.add(docFamilies[0]);
  return [...hits];
}

// ── Core: fetch + persist one document ───────────────────────────────────────
async function processDocument(doc, families, idx, total) {
  console.log(`\n[${idx}/${total}] ${doc.title}`);

  // 1. Resolve FRBR URI
  let frbrUri = buildFrbrUri(doc);
  if (!frbrUri) {
    console.log("  ↳ No direct FRBR URI — searching...");
    frbrUri = await searchFrbrUri(doc);
  }
  if (!frbrUri) {
    console.warn("  ❌ Could not find FRBR URI — skipping.");
    return { ok: false, reason: "no_frbr" };
  }
  console.log(`  ↳ FRBR: ${frbrUri}`);

  // 2. Fetch full law detail
  let lawData;
  try {
    lawData = await apiGet(`/laws${frbrUri}`);
    await sleep(GAP_MS);
  } catch (e) {
    if (e.message.startsWith("404")) {
      console.warn("  ❌ 404 — not in pasal.id database.");
      return { ok: false, reason: "not_found" };
    }
    throw e;
  }

  const work = lawData.work ?? {};
  const articles = lawData.articles ?? [];
  const pasals = articles.filter((a) => a.type === "pasal" || a.node_type === "pasal");
  console.log(`  ↳ Status: ${work.status ?? "?"} | Total nodes: ${articles.length} | Pasals: ${pasals.length}`);

  // 3. Upsert LegalDocument
  const docId = createHash("sha256").update(frbrUri).digest("hex").slice(0, 24);
  const sourceUrl = `https://pasal.id${frbrUri}`;
  const amendedBy = lawData.relationships
    ?.filter((r) => /amend|ubah/i.test(r.type_en ?? r.type ?? ""))
    .map((r) => r.related_work?.frbr_uri)
    .filter(Boolean)
    .join(", ") || null;

  await prisma.legalDocument.upsert({
    where: { id: docId },
    update: {
      title: work.title ?? doc.title,
      type: work.type ?? doc.type,
      number: (work.number ?? doc.number)?.toString() ?? null,
      year: work.year ?? doc.year,
      sourceUrl,
      sourceHost: "pasal.id",
      contentHash: createHash("sha256").update(frbrUri + (work.status ?? "")).digest("hex").slice(0, 16),
      legalStatus: mapStatus(work.status),
      amendedBy,
    },
    create: {
      id: docId,
      title: work.title ?? doc.title,
      type: work.type ?? doc.type,
      number: (work.number ?? doc.number)?.toString() ?? null,
      year: work.year ?? doc.year,
      sourceUrl,
      sourceHost: "pasal.id",
      contentHash: createHash("sha256").update(frbrUri + (work.status ?? "")).digest("hex").slice(0, 16),
      legalStatus: mapStatus(work.status),
      amendedBy,
    },
  });

  // 4. Upsert LegalArticle per pasal
  let saved = 0, skipped = 0;
  for (const pasal of pasals) {
    const text = (pasal.content ?? pasal.text ?? "").trim();
    const articleNumber = `Pasal ${pasal.number ?? pasal.node_number ?? "?"}`;
    const heading = pasal.heading ?? null;

    if (text.length < 10) { skipped++; continue; }

    const tags = tagArticle(`${articleNumber} ${heading ?? ""} ${text}`, families);
    const normalizedText = normText(`${articleNumber} ${heading ?? ""} ${text} ${tags.join(" ")}`);
    const contentHash = createHash("sha256").update(docId + articleNumber + text).digest("hex");

    await prisma.legalArticle.upsert({
      where: { contentHash },
      update: { documentId: docId, articleNumber, title: heading, text, tags: JSON.stringify(tags), normalizedText, sourceUrl },
      create:  { documentId: docId, articleNumber, title: heading, text, tags: JSON.stringify(tags), normalizedText, sourceUrl, contentHash },
    });
    saved++;
  }

  console.log(`  ✅ ${saved} pasal saved, ${skipped} skipped.`);
  return { ok: true, saved, title: work.title ?? doc.title };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(SOURCES_PATH)) {
    console.error("data/legal-sources.json tidak ditemukan. Jalankan discover-sources.mjs dulu.");
    process.exit(1);
  }

  const sourcesMapping = JSON.parse(readFileSync(SOURCES_PATH, "utf8"));

  // Deduplicate by title, aggregate families
  const docMap = new Map();
  for (const [family, docs] of Object.entries(sourcesMapping)) {
    for (const doc of docs) {
      if (!docMap.has(doc.title)) docMap.set(doc.title, { doc, families: [] });
      docMap.get(doc.title).families.push(family);
    }
  }

  const entries = [...docMap.values()];
  const total = entries.length;
  console.log(`\n🚀 Memproses ${total} dokumen dari pasal.id (${TOKEN_POOL.length} token aktif)\n`);

  const log = [];
  let totalArticles = 0, successCount = 0, failCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const { doc, families } = entries[i];
    try {
      const res = await processDocument(doc, families, i + 1, total);
      if (res.ok) {
        successCount++;
        totalArticles += res.saved ?? 0;
        log.push(`✅ ${res.title} — ${res.saved} pasal`);
      } else {
        failCount++;
        log.push(`❌ ${doc.title} — ${res.reason}`);
      }
    } catch (err) {
      failCount++;
      console.error(`  💥 Error: ${err.message}`);
      log.push(`💥 ${doc.title} — ${err.message.slice(0, 80)}`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Berhasil: ${successCount}/${total}`);
  console.log(`❌ Gagal:    ${failCount}/${total}`);
  console.log(`📄 Total pasal tersimpan: ${totalArticles}`);

  // ── Worklog ────────────────────────────────────────────────────────────────
  const now = new Date().toISOString().replace("T", " ").slice(0, 16);
  appendFileSync(
    WORKLOG_PATH,
    `
---
Task ID: auto
Agent: main (Antigravity) — pasal.id Legal Corpus Fetch
Date: ${now}

Task: Mengambil semua artikel hukum dari pasal.id API (token pool ${TOKEN_POOL.length} token).

Work Log:
- Token pool ${TOKEN_POOL.length} token aktif dengan round-robin rotation.
- FRBR URI dibangun otomatis dari type/number/year; fallback ke /search.
- Upsert LegalDocument + LegalArticle ke SQLite/Turso via Prisma.
- FTS5 triggers otomatis mengindeks artikel baru.

Hasil: ${successCount}/${total} dokumen berhasil, ${totalArticles} pasal tersimpan.

Detail:
${log.map((l) => "- " + l).join("\n")}

Stage Summary:
- Corpus hukum diambil langsung dari pasal.id API (structured), bukan scraping BPK.
- Tidak ada PDF download, tidak ada regex parser, tidak ada ID hunting.
`,
    "utf8"
  );

  console.log("📋 Worklog diperbarui.");
  await prisma.$disconnect();
}

await main();
