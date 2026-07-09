# Legal Corpus Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast legal corpus database for Indonesian laws, articles, and legal references so KontrakPaham can retrieve relevant pasal context before calling You.com.

**Architecture:** Turso remains the fast query/index layer. Google Drive is optional cold storage for large source files, not the search engine. The app translates messy user/contract language into normalized legal issues, searches Turso indexes first, then falls back to You.com only when local confidence is low.

**Tech Stack:** Next.js 16, Prisma 7 with `@prisma/adapter-libsql`, Turso/libSQL, Bun tests, optional Google Drive API OAuth.

---

## Design Summary

Users will not search with formal legal wording. The search path must accept messy, layperson text from contracts and convert it into stable legal retrieval signals.

The retrieval flow is:

```text
contract text
  -> issue extraction (rules + optional LLM translator)
  -> Turso LegalArticleIndex keyword/tag search
  -> LegalArticle context returned with source/citation
  -> if confidence is low, fallback to existing You.com research
```

Google Drive is used only after Turso has already found a record. Drive stores original PDFs, OCR text, or large snapshots. Turso stores the searchable metadata, pasal text, tags, normalized tokens, and Drive file IDs.

## Google Drive Connection Model

Google Drive API keys alone are not enough for private Drive files. For a personal Google One account, use OAuth 2.0:

1. Create a Google Cloud project.
2. Enable Google Drive API.
3. Configure OAuth consent screen.
4. Create OAuth Client ID for a web app or local bootstrap script.
5. Run a one-time local OAuth flow with the Google account that owns the 5TB Google One storage.
6. Store the refresh token in Koyeb env as `GOOGLE_DRIVE_REFRESH_TOKEN`.
7. Store `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, and `GOOGLE_DRIVE_ARCHIVE_FOLDER_ID`.

Service accounts are not the best default for Google One personal storage because they do not simply inherit a personal account's Google One quota. They are better for Workspace/domain-managed setups. For this project, OAuth user consent is the practical route.

## Files To Create Or Modify

- Modify: `prisma/schema.prisma`
  - Add `LegalDocument`, `LegalArticle`, `LegalArticleIndex`, and optional `LegalSourceBlob`.
- Modify: `scripts/apply-core-schema.mjs`
  - Include legal corpus tables for new Turso database bootstrap.
- Create: `scripts/apply-legal-corpus-schema.mjs`
  - Idempotent schema migration for local SQLite and Turso.
- Create: `src/lib/legal-corpus.ts`
  - Normalization, issue extraction, index search, scoring, and context formatting.
- Create: `src/lib/legal-corpus.test.ts`
  - Unit tests for query normalization, issue aliases, scoring, and context formatting.
- Modify: `src/lib/research.ts`
  - Search legal corpus before You.com.
- Create: `src/lib/legal-corpus-seed.ts`
  - Seed helpers for known legal documents/articles.
- Create: `scripts/seed-legal-corpus.mjs`
  - CLI seed script for curated pasal data.
- Optional create: `src/lib/google-drive-archive.ts`
  - OAuth client and file metadata helper for archive-only use.
- Optional create: `scripts/google-drive-auth.mjs`
  - One-time local OAuth helper to obtain refresh token.
- Modify: `worklog.md`
  - Record each completed implementation task.

---

### Task 1: Legal Corpus Helper Tests

**Files:**
- Create: `src/lib/legal-corpus.test.ts`
- Create later in Task 2: `src/lib/legal-corpus.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, test } from "bun:test";
import {
  buildLegalCorpusContext,
  extractLegalIssueSignals,
  normalizeLegalSearchText,
  scoreLegalArticle,
} from "./legal-corpus";

describe("legal corpus helpers", () => {
  test("normalizes layperson wording into searchable text", () => {
    expect(normalizeLegalSearchText("  Denda 2% / HARI!!! telat bayar  "))
      .toBe("denda 2 hari telat bayar");
  });

  test("extracts legal issue signals from messy user language", () => {
    const signals = extractLegalIssueSignals(
      "Kalau telat bayar dendanya gede banget dan kontrak bisa diputus sepihak.",
    );

    expect(signals.tags).toContain("denda");
    expect(signals.tags).toContain("pemutusan_sepihak");
    expect(signals.keywords).toContain("telat bayar");
  });

  test("scores exact tags higher than loose keyword matches", () => {
    const score = scoreLegalArticle(
      {
        tags: ["klausul_baku", "denda"],
        normalizedText: "pasal klausul baku denda konsumen",
      },
      {
        tags: ["denda"],
        keywords: ["denda telat bayar"],
        normalizedQuery: "denda telat bayar sepihak",
      },
    );

    expect(score).toBeGreaterThanOrEqual(12);
  });

  test("formats legal corpus context with citation and source url", () => {
    const context = buildLegalCorpusContext([
      {
        documentTitle: "UU Perlindungan Konsumen",
        articleNumber: "Pasal 18",
        articleText: "Pelaku usaha dilarang mencantumkan klausul baku tertentu.",
        plainSummary: "Klausul baku yang terlalu sepihak dapat bermasalah.",
        sourceUrl: "https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999",
        score: 18,
      },
    ]);

    expect(context.content).toContain("UU Perlindungan Konsumen Pasal 18");
    expect(context.content).toContain("https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999");
    expect(context.sources[0]?.url).toContain("peraturan.bpk.go.id");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: FAIL because `src/lib/legal-corpus.ts` does not exist.

- [ ] **Step 3: Commit failing tests**

```bash
git add src/lib/legal-corpus.test.ts
git commit -m "test: define legal corpus retrieval helpers"
```

---

### Task 2: Legal Corpus Helper Implementation

**Files:**
- Create: `src/lib/legal-corpus.ts`

- [ ] **Step 1: Implement minimal helper module**

```ts
import type { ResearchSource } from "@/lib/research";

export interface LegalIssueSignals {
  normalizedQuery: string;
  tags: string[];
  keywords: string[];
}

export interface LegalArticleSearchRow {
  tags: string[];
  normalizedText: string;
}

export interface LegalCorpusResult {
  documentTitle: string;
  articleNumber: string;
  articleText: string;
  plainSummary: string | null;
  sourceUrl: string | null;
  score: number;
}

export interface LegalCorpusContext {
  enabled: boolean;
  query: string;
  content: string;
  sources: ResearchSource[];
  latencyMs: number;
  confidence: "low" | "medium" | "high";
}

const ISSUE_ALIASES: Array<{ tag: string; phrases: string[] }> = [
  { tag: "denda", phrases: ["denda", "penalty", "telat bayar", "terlambat bayar", "keterlambatan"] },
  { tag: "pemutusan_sepihak", phrases: ["putus sepihak", "diputus sepihak", "mengakhiri sepihak", "pembatalan sepihak"] },
  { tag: "klausul_baku", phrases: ["klausul baku", "syarat sepihak", "tidak bisa dinegosiasi", "take it or leave it"] },
  { tag: "perlindungan_konsumen", phrases: ["konsumen", "pelanggan", "pembeli", "penyewa"] },
  { tag: "data_pribadi", phrases: ["data pribadi", "nik", "ktp", "privasi", "nomor hp"] },
  { tag: "sengketa", phrases: ["sengketa", "arbitrase", "pengadilan", "domisili hukum"] },
  { tag: "force_majeure", phrases: ["force majeure", "keadaan kahar", "bencana", "di luar kuasa"] },
];

export function normalizeLegalSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractLegalIssueSignals(text: string): LegalIssueSignals {
  const normalizedQuery = normalizeLegalSearchText(text);
  const tags = new Set<string>();
  const keywords = new Set<string>();

  for (const alias of ISSUE_ALIASES) {
    for (const phrase of alias.phrases) {
      if (normalizedQuery.includes(normalizeLegalSearchText(phrase))) {
        tags.add(alias.tag);
        keywords.add(phrase);
      }
    }
  }

  for (const token of normalizedQuery.split(" ")) {
    if (token.length >= 5) keywords.add(token);
  }

  return {
    normalizedQuery,
    tags: [...tags],
    keywords: [...keywords].slice(0, 24),
  };
}

export function scoreLegalArticle(row: LegalArticleSearchRow, signals: LegalIssueSignals) {
  let score = 0;
  const rowTags = new Set(row.tags);
  for (const tag of signals.tags) {
    if (rowTags.has(tag)) score += 12;
  }
  for (const keyword of signals.keywords) {
    if (row.normalizedText.includes(normalizeLegalSearchText(keyword))) score += 2;
  }
  if (signals.normalizedQuery && row.normalizedText.includes(signals.normalizedQuery)) score += 8;
  return score;
}

export function confidenceFromScore(score: number): LegalCorpusContext["confidence"] {
  if (score >= 18) return "high";
  if (score >= 8) return "medium";
  return "low";
}

export function buildLegalCorpusContext(results: LegalCorpusResult[]): LegalCorpusContext {
  const top = results.slice(0, 6);
  const bestScore = top[0]?.score || 0;
  const sources = top
    .filter((item) => item.sourceUrl)
    .map((item) => ({
      title: `${item.documentTitle} ${item.articleNumber}`,
      url: item.sourceUrl as string,
    }));

  const content = top
    .map((item, index) => {
      const summary = item.plainSummary ? `Ringkasan: ${item.plainSummary}\n` : "";
      const source = item.sourceUrl ? `Sumber: ${item.sourceUrl}\n` : "";
      return `${index + 1}. ${item.documentTitle} ${item.articleNumber}\n${summary}Teks: ${item.articleText}\n${source}Skor: ${item.score}`;
    })
    .join("\n\n");

  return {
    enabled: top.length > 0,
    query: "",
    content,
    sources,
    latencyMs: 0,
    confidence: confidenceFromScore(bestScore),
  };
}
```

- [ ] **Step 2: Run helper tests**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit helper implementation**

```bash
git add src/lib/legal-corpus.ts src/lib/legal-corpus.test.ts
git commit -m "feat: add legal corpus retrieval helpers"
```

---

### Task 3: Database Schema And Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `scripts/apply-core-schema.mjs`
- Create: `scripts/apply-legal-corpus-schema.mjs`

- [ ] **Step 1: Add Prisma models**

Add these models to `prisma/schema.prisma`:

```prisma
model LegalDocument {
  id              String   @id @default(cuid())
  title           String
  type            String
  number          String?
  year            Int?
  jurisdiction    String   @default("ID")
  sourceUrl       String?
  sourceHost      String?
  status          String   @default("ACTIVE")
  driveFileId     String?
  contentHash     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  articles LegalArticle[]

  @@index([type, year])
  @@index([sourceHost])
}

model LegalArticle {
  id              String   @id @default(cuid())
  documentId      String
  articleNumber   String
  title           String?
  text            String
  plainSummary    String?
  tags            String
  normalizedText  String
  sourceUrl       String?
  contentHash     String   @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  document LegalDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  indexRows LegalArticleIndex[]

  @@index([documentId, articleNumber])
}

model LegalArticleIndex {
  id         String @id @default(cuid())
  articleId  String
  token      String
  tag        String?
  weight     Int    @default(1)

  article LegalArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([tag])
  @@unique([articleId, token])
}
```

- [ ] **Step 2: Write idempotent schema script**

Create `scripts/apply-legal-corpus-schema.mjs`:

```js
import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1);
  }
}

const statements = [
  `CREATE TABLE IF NOT EXISTS "LegalDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "year" INTEGER,
    "jurisdiction" TEXT NOT NULL DEFAULT 'ID',
    "sourceUrl" TEXT,
    "sourceHost" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "driveFileId" TEXT,
    "contentHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "LegalDocument_type_year_idx" ON "LegalDocument"("type", "year")`,
  `CREATE INDEX IF NOT EXISTS "LegalDocument_sourceHost_idx" ON "LegalDocument"("sourceHost")`,
  `CREATE TABLE IF NOT EXISTS "LegalArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "plainSummary" TEXT,
    "tags" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "contentHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LegalArticle_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LegalArticle_contentHash_key" ON "LegalArticle"("contentHash")`,
  `CREATE INDEX IF NOT EXISTS "LegalArticle_documentId_articleNumber_idx" ON "LegalArticle"("documentId", "articleNumber")`,
  `CREATE TABLE IF NOT EXISTS "LegalArticleIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tag" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "LegalArticleIndex_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LegalArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "LegalArticleIndex_token_idx" ON "LegalArticleIndex"("token")`,
  `CREATE INDEX IF NOT EXISTS "LegalArticleIndex_tag_idx" ON "LegalArticleIndex"("tag")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LegalArticleIndex_articleId_token_key" ON "LegalArticleIndex"("articleId", "token")`,
];

async function apply(client, label) {
  for (const statement of statements) {
    await client.execute(statement);
  }
  console.log(`${label}: legal corpus schema ready`);
}

async function withClient(config, label) {
  const client = createClient(config);
  try {
    await apply(client, label);
  } finally {
    client.close();
  }
}

await withClient({ url: process.env.LOCAL_SQLITE_URL || "file:db/custom.db" }, "local");

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  await withClient(
    { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN },
    "turso",
  );
} else {
  console.log("turso: skipped (TURSO_DATABASE_URL/TURSO_AUTH_TOKEN missing)");
}
```

- [ ] **Step 3: Add the same table statements to `scripts/apply-core-schema.mjs`**

Add legal corpus table/index statements near the other core schema statements so new databases are bootstrapped completely.

- [ ] **Step 4: Run migration script**

Run: `node scripts/apply-legal-corpus-schema.mjs`

Expected:

```text
local: legal corpus schema ready
turso: legal corpus schema ready
```

- [ ] **Step 5: Generate Prisma client**

Run: `bunx prisma generate`

Expected: Prisma Client generated successfully.

- [ ] **Step 6: Commit schema**

```bash
git add prisma/schema.prisma scripts/apply-core-schema.mjs scripts/apply-legal-corpus-schema.mjs
git commit -m "feat: add legal corpus schema"
```

---

### Task 4: Seed Curated Legal Articles

**Files:**
- Create: `src/lib/legal-corpus-seed.ts`
- Create: `scripts/seed-legal-corpus.mjs`

- [ ] **Step 1: Create seed data helper**

Create `src/lib/legal-corpus-seed.ts`:

```ts
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { extractLegalIssueSignals, normalizeLegalSearchText } from "@/lib/legal-corpus";

export interface SeedLegalArticleInput {
  document: {
    title: string;
    type: string;
    number?: string;
    year?: number;
    sourceUrl?: string;
    sourceHost?: string;
  };
  articleNumber: string;
  title?: string;
  text: string;
  plainSummary?: string;
  tags: string[];
  sourceUrl?: string;
}

function hashArticle(input: SeedLegalArticleInput) {
  return createHash("sha256")
    .update(`${input.document.title}|${input.articleNumber}|${input.text}`, "utf8")
    .digest("hex");
}

function tokensForArticle(input: SeedLegalArticleInput) {
  const signals = extractLegalIssueSignals(`${input.text} ${input.plainSummary || ""} ${input.tags.join(" ")}`);
  return [...new Set([...signals.keywords, ...input.tags, ...signals.normalizedQuery.split(" ")])]
    .map(normalizeLegalSearchText)
    .filter((token) => token.length >= 3)
    .slice(0, 80);
}

export async function seedLegalArticles(items: SeedLegalArticleInput[]) {
  for (const item of items) {
    const document = await db.legalDocument.upsert({
      where: { id: createHash("sha256").update(item.document.title).digest("hex").slice(0, 24) },
      create: {
        id: createHash("sha256").update(item.document.title).digest("hex").slice(0, 24),
        title: item.document.title,
        type: item.document.type,
        number: item.document.number || null,
        year: item.document.year || null,
        sourceUrl: item.document.sourceUrl || null,
        sourceHost: item.document.sourceHost || null,
        updatedAt: new Date(),
      },
      update: {
        type: item.document.type,
        number: item.document.number || null,
        year: item.document.year || null,
        sourceUrl: item.document.sourceUrl || null,
        sourceHost: item.document.sourceHost || null,
        updatedAt: new Date(),
      },
    });

    const contentHash = hashArticle(item);
    const article = await db.legalArticle.upsert({
      where: { contentHash },
      create: {
        documentId: document.id,
        articleNumber: item.articleNumber,
        title: item.title || null,
        text: item.text,
        plainSummary: item.plainSummary || null,
        tags: JSON.stringify(item.tags),
        normalizedText: normalizeLegalSearchText(`${item.articleNumber} ${item.title || ""} ${item.text} ${item.plainSummary || ""} ${item.tags.join(" ")}`),
        sourceUrl: item.sourceUrl || item.document.sourceUrl || null,
        contentHash,
        updatedAt: new Date(),
      },
      update: {
        articleNumber: item.articleNumber,
        title: item.title || null,
        text: item.text,
        plainSummary: item.plainSummary || null,
        tags: JSON.stringify(item.tags),
        normalizedText: normalizeLegalSearchText(`${item.articleNumber} ${item.title || ""} ${item.text} ${item.plainSummary || ""} ${item.tags.join(" ")}`),
        sourceUrl: item.sourceUrl || item.document.sourceUrl || null,
        updatedAt: new Date(),
      },
    });

    for (const token of tokensForArticle(item)) {
      await db.legalArticleIndex.upsert({
        where: { articleId_token: { articleId: article.id, token } },
        create: {
          articleId: article.id,
          token,
          tag: item.tags.includes(token) ? token : null,
          weight: item.tags.includes(token) ? 5 : 1,
        },
        update: {
          tag: item.tags.includes(token) ? token : null,
          weight: item.tags.includes(token) ? 5 : 1,
        },
      });
    }
  }
}
```

- [ ] **Step 2: Create seed script**

Create `scripts/seed-legal-corpus.mjs`:

```js
import { seedLegalArticles } from "../src/lib/legal-corpus-seed.ts";

await seedLegalArticles([
  {
    document: {
      title: "Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen",
      type: "UU",
      number: "8",
      year: 1999,
      sourceUrl: "https://peraturan.bpk.go.id/Details/45288/uu-no-8-tahun-1999",
      sourceHost: "peraturan.bpk.go.id",
    },
    articleNumber: "Pasal 18",
    title: "Klausul Baku",
    text: "Pelaku usaha dalam menawarkan barang dan/atau jasa yang ditujukan untuk diperdagangkan dilarang membuat atau mencantumkan klausula baku pada setiap dokumen dan/atau perjanjian apabila menyatakan pengalihan tanggung jawab pelaku usaha.",
    plainSummary: "Klausul baku yang mengalihkan tanggung jawab secara sepihak dapat berisiko bagi konsumen.",
    tags: ["klausul_baku", "perlindungan_konsumen", "pengalihan_risiko"],
  },
  {
    document: {
      title: "Kitab Undang-Undang Hukum Perdata",
      type: "KUHPerdata",
      sourceUrl: "https://peraturan.bpk.go.id/Details/150927/kuhperdata",
      sourceHost: "peraturan.bpk.go.id",
    },
    articleNumber: "Pasal 1320",
    title: "Syarat Sah Perjanjian",
    text: "Supaya terjadi persetujuan yang sah, perlu dipenuhi empat syarat: kesepakatan mereka yang mengikatkan dirinya, kecakapan untuk membuat suatu perikatan, suatu pokok persoalan tertentu, dan suatu sebab yang tidak terlarang.",
    plainSummary: "Perjanjian perlu memenuhi kesepakatan, kecakapan, objek tertentu, dan sebab yang tidak terlarang.",
    tags: ["syarat_sah_perjanjian", "kesepakatan", "perjanjian"],
  },
]);

console.log("Legal corpus seed complete.");
```

- [ ] **Step 3: Run seed script**

Run: `bun scripts/seed-legal-corpus.mjs`

Expected: `Legal corpus seed complete.`

- [ ] **Step 4: Commit seed support**

```bash
git add src/lib/legal-corpus-seed.ts scripts/seed-legal-corpus.mjs
git commit -m "feat: seed initial legal corpus"
```

---

### Task 5: Database Search Integration

**Files:**
- Modify: `src/lib/legal-corpus.ts`
- Modify: `src/lib/legal-corpus.test.ts`

- [ ] **Step 1: Add failing test for result formatting from DB-like rows**

Append to `src/lib/legal-corpus.test.ts`:

```ts
test("parses article tags from stored JSON", () => {
  const row = {
    tags: '["denda","klausul_baku"]',
    normalizedText: "denda klausul baku",
  };

  expect(parseStoredTags(row.tags)).toEqual(["denda", "klausul_baku"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: FAIL because `parseStoredTags` is not exported.

- [ ] **Step 3: Implement `parseStoredTags` and `searchLegalCorpus`**

Add to `src/lib/legal-corpus.ts`:

```ts
import { db } from "@/lib/db";

export function parseStoredTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function searchLegalCorpus(text: string, limit = 6): Promise<LegalCorpusContext | null> {
  const started = Date.now();
  const signals = extractLegalIssueSignals(text);
  if (!signals.tags.length && !signals.keywords.length) return null;

  const tokens = [...new Set([...signals.tags, ...signals.keywords.map(normalizeLegalSearchText)])]
    .filter((token) => token.length >= 3)
    .slice(0, 24);

  const indexRows = await db.legalArticleIndex.findMany({
    where: {
      OR: [
        { token: { in: tokens } },
        { tag: { in: signals.tags } },
      ],
    },
    include: {
      article: {
        include: { document: true },
      },
    },
    take: 80,
  });

  const byArticle = new Map<string, LegalCorpusResult & { tags: string[]; normalizedText: string }>();
  for (const row of indexRows) {
    const article = row.article;
    const tags = parseStoredTags(article.tags);
    const existing = byArticle.get(article.id);
    const baseScore = scoreLegalArticle(
      { tags, normalizedText: article.normalizedText },
      signals,
    ) + row.weight;

    if (!existing || baseScore > existing.score) {
      byArticle.set(article.id, {
        documentTitle: article.document.title,
        articleNumber: article.articleNumber,
        articleText: article.text,
        plainSummary: article.plainSummary,
        sourceUrl: article.sourceUrl || article.document.sourceUrl,
        score: baseScore,
        tags,
        normalizedText: article.normalizedText,
      });
    }
  }

  const results = [...byArticle.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!results.length) return null;
  const context = buildLegalCorpusContext(results);
  return {
    ...context,
    query: signals.normalizedQuery,
    latencyMs: Date.now() - started,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `bun test src/lib/legal-corpus.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit search integration**

```bash
git add src/lib/legal-corpus.ts src/lib/legal-corpus.test.ts
git commit -m "feat: search legal corpus index"
```

---

### Task 6: Use Legal Corpus Before You.com

**Files:**
- Modify: `src/lib/research.ts`

- [ ] **Step 1: Add legal corpus import**

Add:

```ts
import { searchLegalCorpus } from "@/lib/legal-corpus";
```

- [ ] **Step 2: Search corpus before You.com**

Inside `buildLegalResearchContext`, after the research plan is chosen and before `getCachedLegalResearch(researchPlan)`, add:

```ts
    const localCorpus = await searchLegalCorpus(`${researchPlan.query}\n\n${compactContract(contractText)}`);
    if (localCorpus && localCorpus.confidence !== "low") {
      console.log(`[TIMING] legal_corpus HIT: ${localCorpus.latencyMs}ms | confidence=${localCorpus.confidence}`);
      return {
        enabled: true,
        effort: researchPlan.effort,
        query: researchPlan.query,
        content: `Riset hukum lokal dari database pasal:\n\n${localCorpus.content}`,
        sources: localCorpus.sources,
        latencyMs: localCorpus.latencyMs,
        warning: "Konteks hukum diambil dari database pasal lokal.",
      };
    }
```

- [ ] **Step 3: Keep fallback behavior unchanged**

Confirm the existing flow still calls `getCachedLegalResearch(researchPlan)` and You.com after a low-confidence corpus miss.

- [ ] **Step 4: Run focused tests**

Run:

```bash
bun test src/lib/legal-corpus.test.ts src/lib/research-cache.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run app checks**

Run:

```bash
bun run lint
```

Expected: PASS.

- [ ] **Step 6: Commit research integration**

```bash
git add src/lib/research.ts
git commit -m "feat: use local legal corpus before web research"
```

---

### Task 7: Optional Google Drive Archive

**Files:**
- Create: `src/lib/google-drive-archive.ts`
- Create: `scripts/google-drive-auth.mjs`
- Modify: `.env.example` if it exists in this repo at implementation time.
- Modify: `worklog.md`

- [ ] **Step 1: Add env names to deployment notes**

Use these env vars:

```env
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_ARCHIVE_FOLDER_ID=
```

- [ ] **Step 2: Create archive helper**

Create `src/lib/google-drive-archive.ts`:

```ts
export function isGoogleDriveArchiveConfigured() {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
    process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID,
  );
}

export function googleDriveArchiveWarning() {
  if (isGoogleDriveArchiveConfigured()) return null;
  return "Google Drive archive is not configured; legal corpus search still works from Turso.";
}
```

- [ ] **Step 3: Defer upload implementation until OAuth is available**

Do not call Drive API from the analyze hot path. Add upload/download only after the OAuth refresh token is available and tested locally.

- [ ] **Step 4: Commit archive config helper**

```bash
git add src/lib/google-drive-archive.ts worklog.md
git commit -m "chore: document google drive archive configuration"
```

---

### Task 8: Final Verification And Worklog

**Files:**
- Modify: `worklog.md`

- [ ] **Step 1: Run all focused tests**

```bash
bun test src/lib/legal-corpus.test.ts src/lib/research-cache.test.ts src/lib/analysis-cache.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

```bash
bun run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build with build placeholders**

PowerShell:

```powershell
$env:DATABASE_URL='file:./build.db'
$env:TURSO_DATABASE_URL=''
$env:TURSO_AUTH_TOKEN=''
$env:JWT_SECRET='build-time-only-placeholder-change-in-runtime'
bun run build
```

Expected: PASS.

- [ ] **Step 4: Update `worklog.md`**

Record:

- Legal corpus schema added.
- Search uses Turso index before You.com.
- Google Drive remains archive-only.
- Tests and build commands.
- Any Koyeb env changes needed.

- [ ] **Step 5: Commit final docs**

```bash
git add worklog.md
git commit -m "docs: record legal corpus implementation"
git push origin main
```

---

## Execution Notes

- Do not store secrets in git.
- Do not read from Google Drive during request-time search.
- Do not call You.com when local legal corpus confidence is medium or high.
- Keep initial corpus small and curated; quality matters more than volume.
- Treat legal corpus citations as context, not legal advice.
- If an implementation worker changes the plan, update this checklist in the same commit.

