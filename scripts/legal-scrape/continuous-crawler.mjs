/**
 * continuous-crawler.mjs
 *
 * Background crawler berkelanjutan untuk mengambil peraturan se-Indonesia dari pasal.id.
 * Menyimpan JSON pasal terstruktur ke Google Drive (5 TB archive) dan mengindeksnya ke database Turso.
 *
 * Mengelola rate limit secara dinamis dengan token pool (4 token).
 * Membatasi maksimal request per jam agar tidak melebihi 900 req/jam per token.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { google } from "googleapis";

// ── Load .env ────────────────────────────────────────────────────────────────
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const TOKEN_POOL = [
  process.env.PASAL_API_TOKEN,
  process.env.PASAL_API_TOKEN_2,
  process.env.PASAL_API_TOKEN_3,
  process.env.PASAL_API_TOKEN_4,
].filter(Boolean);

if (TOKEN_POOL.length === 0) {
  console.error("Tidak ada token pasal.id di .env");
  process.exit(1);
}

// ── Initialize Google Drive Client ───────────────────────────────────────────
let drive = null;
const folderId = process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID;

if (
  process.env.GOOGLE_DRIVE_CLIENT_ID &&
  process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
  process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
  folderId
) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI || "http://localhost:3000/api/google-drive/oauth/callback"
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });
    drive = google.drive({ version: "v3", auth: oauth2Client });
    console.log("📁 Google Drive Archiver diaktifkan.");
  } catch (err) {
    console.warn("⚠️ Gagal menginisialisasi Google Drive Client:", err.message);
  }
}

// ── Initialize Prisma ────────────────────────────────────────────────────────
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

const API_BASE = "https://pasal.id/api/v1";

// ── Rate Limit Pool Management ────────────────────────────────────────────────
let tokenIndex = 0;
function nextToken() {
  return TOKEN_POOL[tokenIndex++ % TOKEN_POOL.length];
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Menghitung jeda dinamis agar pas 3600 request per jam untuk 4 token.
// 3600 request / 3600 detik = 1 request / detik (1000ms).
const REQUEST_GAP_MS = Math.ceil(3600000 / (900 * TOKEN_POOL.length)); 

async function apiGet(path, retries = 3) {
  const token = nextToken();
  const url = `${API_BASE}${path}`;
  await sleep(REQUEST_GAP_MS); // Jeda konstan yang aman dari rate limit

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (resp.status === 429) {
      console.warn(`  ⚠️  429 Rate limited. Menunggu 30 detik sebelum mencoba kembali...`);
      await sleep(30000);
      if (retries > 0) return apiGet(path, retries - 1);
      throw new Error("Rate limit block persists");
    }

    if (resp.status === 404) {
      return null;
    }

    if (resp.status >= 500) {
      console.warn(`  ⚠️  Server Error ${resp.status} for ${url}. Skipping...`);
      return null;
    }

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    return resp.json();
  } catch (err) {
    if (retries > 0) {
      console.warn(`  Retry link ${url} karena: ${err.message}`);
      await sleep(5000);
      return apiGet(path, retries - 1);
    }
    // Return null instead of crashing the process on network or API failures
    console.error(`  💥 Gagal mengambil ${url}:`, err.message);
    return null;
  }
}

// ── Google Drive Upload Helper ───────────────────────────────────────────────
async function uploadToDrive(filename, contentString) {
  if (!drive) return null;
  try {
    // Cek apakah file sudah ada di folder Drive
    const response = await drive.files.list({
      q: `'${folderId}' in parents and name = '${filename}' and trashed = false`,
      fields: "files(id)",
      spaces: "drive",
    });
    
    const existingFiles = response.data.files;
    const media = {
      mimeType: "application/json",
      body: contentString,
    };

    if (existingFiles && existingFiles.length > 0) {
      // Update file jika sudah ada
      const fileId = existingFiles[0].id;
      await drive.files.update({
        fileId,
        media,
      });
      return fileId;
    } else {
      // Create baru
      const fileMetadata = {
        name: filename,
        parents: [folderId],
      };
      const res = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id",
      });
      return res.data.id;
    }
  } catch (err) {
    console.error("  ❌ Gagal mengunggah file ke Google Drive:", err.message);
    return null;
  }
}

// ── Text Normalizer ──────────────────────────────────────────────────────────
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

// ── Main Continuous Loop ──────────────────────────────────────────────────────
async function runCrawler() {
  const targetTypes = ["UU", "PP", "PERPRES", "POJK"];
  const startYear = 1995;
  const currentYear = new Date().getFullYear();

  console.log(`\n🚀 Memulai continuous crawler...`);
  console.log(`Rentang tahun: ${startYear} - ${currentYear}`);
  console.log(`Jenis target: ${targetTypes.join(", ")}`);
  console.log(`Request delay interval: ${REQUEST_GAP_MS}ms\n`);

  for (let year = currentYear; year >= startYear; year--) {
    for (const type of targetTypes) {
      console.log(`\n📂 Scanning: ${type} Tahun ${year}...`);
      let offset = 0;
      const limit = 50;

      while (true) {
        const listPath = `/laws?type=${type}&year=${year}&limit=${limit}&offset=${offset}`;
        const data = await apiGet(listPath);
        
        if (!data || !data.laws || data.laws.length === 0) {
          break; // Selesai untuk kombinasi type + year ini
        }

        console.log(`  Ditemukan ${data.laws.length} daftar undang-undang/peraturan (offset ${offset})`);

        for (const law of data.laws) {
          try {
            const frbrUri = law.frbr_uri;
            const docId = createHash("sha256").update(frbrUri).digest("hex").slice(0, 24);

            // Cek apakah dokumen ini sudah di-indexing sebelumnya
            const existingDoc = await prisma.legalDocument.findUnique({
              where: { id: docId },
              select: { id: true },
            });

            if (existingDoc) {
              console.log(`  [Skip] ${law.title} sudah terindeks.`);
              continue;
            }

            console.log(`  ⬇️ Mengunduh isi: ${law.title} (${frbrUri})...`);
            const lawDetail = await apiGet(`/laws${frbrUri}`);
            if (!lawDetail) continue;

            // 1. Simpan salinan data asli terstruktur ke Google Drive (5 TB Backup Archive)
            const gdriveFilename = `${docId}.json`;
            const contentString = JSON.stringify(lawDetail, null, 2);
            const driveFileId = await uploadToDrive(gdriveFilename, contentString);
            if (driveFileId) {
              console.log(`  ✅ Diarsipkan ke GDrive (ID: ${driveFileId})`);
            }

            // 2. Index ke Database Turso
            const work = lawDetail.work ?? {};
            const articles = lawDetail.articles ?? [];
            const pasals = articles.filter((a) => a.type === "pasal" || a.node_type === "pasal");
            
            const amendedBy = lawDetail.relationships
              ?.filter((r) => /amend|ubah/i.test(r.type_en ?? r.type ?? ""))
              .map((r) => r.related_work?.frbr_uri)
              .filter(Boolean)
              .join(", ") || null;

            await prisma.legalDocument.upsert({
              where: { id: docId },
              update: {
                title: work.title ?? law.title,
                type: work.type ?? law.type,
                number: (work.number ?? law.number)?.toString() ?? null,
                year: work.year ?? law.year,
                sourceUrl: `https://pasal.id${frbrUri}`,
                sourceHost: "pasal.id",
                contentHash: createHash("sha256").update(frbrUri + (work.status ?? "")).digest("hex").slice(0, 16),
                legalStatus: mapStatus(work.status),
                amendedBy,
              },
              create: {
                id: docId,
                title: work.title ?? law.title,
                type: work.type ?? law.type,
                number: (work.number ?? law.number)?.toString() ?? null,
                year: work.year ?? law.year,
                sourceUrl: `https://pasal.id${frbrUri}`,
                sourceHost: "pasal.id",
                contentHash: createHash("sha256").update(frbrUri + (work.status ?? "")).digest("hex").slice(0, 16),
                legalStatus: mapStatus(work.status),
                amendedBy,
              },
            });

            let saved = 0;
            for (const pasal of pasals) {
              const text = (pasal.content ?? pasal.text ?? "").trim();
              const articleNumber = `Pasal ${pasal.number ?? pasal.node_number ?? "?"}`;
              const heading = pasal.heading ?? null;

              if (text.length < 10) continue;

              const tags = [type.toLowerCase()]; // Fallback tag
              const normalizedText = normText(`${articleNumber} ${heading ?? ""} ${text} ${tags.join(" ")}`);
              const contentHash = createHash("sha256").update(docId + articleNumber + text).digest("hex");

              await prisma.legalArticle.upsert({
                where: { contentHash },
                update: {
                  documentId: docId,
                  articleNumber,
                  title: heading,
                  text,
                  tags: JSON.stringify(tags),
                  normalizedText,
                  sourceUrl: `https://pasal.id${frbrUri}`,
                },
                create: {
                  documentId: docId,
                  articleNumber,
                  title: heading,
                  text,
                  tags: JSON.stringify(tags),
                  normalizedText,
                  sourceUrl: `https://pasal.id${frbrUri}`,
                  contentHash,
                },
              });
              saved++;
            }
            console.log(`  ✅ Tersimpan ke Turso: ${saved} pasal.`);

          } catch (e) {
            console.error(`  💥 Gagal memproses ${law.title}: ${e.message}`);
          }
        }

        offset += limit;
      }
    }
  }

  console.log("\n🏁 Continuous crawler telah menyelesaikan scan seluruh regulasi target.");
  await prisma.$disconnect();
}

runCrawler().catch(console.error);
