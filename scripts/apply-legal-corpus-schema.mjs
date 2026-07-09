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
  `CREATE VIRTUAL TABLE IF NOT EXISTS "LegalArticleFts" USING fts5(
    "text",
    "plainSummary",
    "tags",
    "normalizedText",
    content='LegalArticle',
    content_rowid='rowid'
  )`,
  `CREATE TRIGGER IF NOT EXISTS "LegalArticle_ai" AFTER INSERT ON "LegalArticle" BEGIN
    INSERT INTO "LegalArticleFts"("rowid", "text", "plainSummary", "tags", "normalizedText")
    VALUES (new."rowid", new."text", new."plainSummary", new."tags", new."normalizedText");
  END;`,
  `CREATE TRIGGER IF NOT EXISTS "LegalArticle_ad" AFTER DELETE ON "LegalArticle" BEGIN
    INSERT INTO "LegalArticleFts"("LegalArticleFts", "rowid", "text", "plainSummary", "tags", "normalizedText")
    VALUES ('delete', old."rowid", old."text", old."plainSummary", old."tags", old."normalizedText");
  END;`,
  `CREATE TRIGGER IF NOT EXISTS "LegalArticle_au" AFTER UPDATE ON "LegalArticle" BEGIN
    INSERT INTO "LegalArticleFts"("LegalArticleFts", "rowid", "text", "plainSummary", "tags", "normalizedText")
    VALUES ('delete', old."rowid", old."text", old."plainSummary", old."tags", old."normalizedText");
    INSERT INTO "LegalArticleFts"("rowid", "text", "plainSummary", "tags", "normalizedText")
    VALUES (new."rowid", new."text", new."plainSummary", new."tags", new."normalizedText");
  END;`,
  `INSERT INTO "LegalArticleFts"("rowid", "text", "plainSummary", "tags", "normalizedText")
   SELECT "rowid", "text", "plainSummary", "tags", "normalizedText" FROM "LegalArticle"
   WHERE "rowid" NOT IN (SELECT "rowid" FROM "LegalArticleFts")`,
  `CREATE TABLE IF NOT EXISTS "LegalArticleQuarantine" (
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
    "quarantineReason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LegalArticleQuarantine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LegalArticleQuarantine_contentHash_key" ON "LegalArticleQuarantine"("contentHash")`,
  `CREATE INDEX IF NOT EXISTS "LegalArticleQuarantine_documentId_articleNumber_idx" ON "LegalArticleQuarantine"("documentId", "articleNumber")`
];

async function addColumnIfNotExists(client, tableName, columnName, columnDefinition) {
  const info = await client.execute(`PRAGMA table_info("${tableName}")`);
  const exists = info.rows.some(row => row.name === columnName);
  if (!exists) {
    await client.execute(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnDefinition}`);
  }
}

async function apply(client, label) {
  for (const statement of statements) {
    await client.execute(statement);
  }
  
  await addColumnIfNotExists(client, "LegalDocument", "legalStatus", "TEXT NOT NULL DEFAULT 'ACTIVE'");
  await addColumnIfNotExists(client, "LegalDocument", "amendedBy", "TEXT");
  
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
