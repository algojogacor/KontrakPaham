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
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "planExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

  `CREATE TABLE IF NOT EXISTS "LicenseCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codeHash" TEXT NOT NULL,
    "codePrefix" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL DEFAULT 1,
    "analysesLimit" INTEGER NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "expiresAt" DATETIME,
    "redeemedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "redeemedById" TEXT,
    CONSTRAINT "LicenseCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LicenseCode_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LicenseCode_codeHash_key" ON "LicenseCode"("codeHash")`,
  `CREATE INDEX IF NOT EXISTS "LicenseCode_plan_idx" ON "LicenseCode"("plan")`,
  `CREATE INDEX IF NOT EXISTS "LicenseCode_createdAt_idx" ON "LicenseCode"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "LicenseCode_redeemedById_idx" ON "LicenseCode"("redeemedById")`,

  `CREATE TABLE IF NOT EXISTS "LlmProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "useJsonResponse" BOOLEAN NOT NULL DEFAULT true,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "temperature" REAL NOT NULL DEFAULT 0.1,
    "timeoutMs" INTEGER NOT NULL DEFAULT 90000,
    "lastStatus" TEXT,
    "lastLatencyMs" INTEGER,
    "lastTestedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "LlmProvider_enabled_priority_idx" ON "LlmProvider"("enabled", "priority")`,

  `CREATE TABLE IF NOT EXISTS "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "fileName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'id',
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "overallRisk" TEXT,
    "riskScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "modelUsed" TEXT,
    "researchEffort" TEXT,
    "researchQuery" TEXT,
    "researchLatencyMs" INTEGER,
    "researchContent" TEXT,
    "researchSources" TEXT,
    "shareToken" TEXT,
    "textHash" TEXT,
    "cacheKey" TEXT,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "cacheSourceId" TEXT,
    "analysisVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Analysis_shareToken_key" ON "Analysis"("shareToken")`,
  `CREATE INDEX IF NOT EXISTS "Analysis_userId_createdAt_idx" ON "Analysis"("userId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Analysis_userId_cacheKey_status_idx" ON "Analysis"("userId", "cacheKey", "status")`,
  `CREATE INDEX IF NOT EXISTS "Analysis_userId_textHash_status_idx" ON "Analysis"("userId", "textHash", "status")`,

  `CREATE TABLE IF NOT EXISTS "Finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "urgency" TEXT NOT NULL,
    "originalClause" TEXT NOT NULL,
    "plainTranslation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "location" TEXT,
    CONSTRAINT "Finding_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Finding_analysisId_idx" ON "Finding"("analysisId")`,

  `CREATE TABLE IF NOT EXISTS "Quota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "analysesUsed" INTEGER NOT NULL DEFAULT 0,
    "analysesLimit" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Quota_userId_month_year_key" ON "Quota"("userId", "month", "year")`,

  `CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token")`,
  `CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId")`,

  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ip" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId")`,

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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

async function applyCoreSchema(client, label) {
  await client.execute("PRAGMA foreign_keys = OFF");
  for (const statement of statements) {
    await client.execute(statement);
  }
  
  await addColumnIfNotExists(client, "LegalDocument", "legalStatus", "TEXT NOT NULL DEFAULT 'ACTIVE'");
  await addColumnIfNotExists(client, "LegalDocument", "amendedBy", "TEXT");
  
  await client.execute("PRAGMA foreign_keys = ON");
  console.log(`${label}: core schema ready`);
}

async function main() {
  const localUrl = process.env.LOCAL_SQLITE_URL || "file:db/custom.db";
  const local = createClient({ url: localUrl });
  try {
    await applyCoreSchema(local, "local");
  } finally {
    local.close();
  }

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.log("turso: skipped (TURSO_DATABASE_URL/TURSO_AUTH_TOKEN missing)");
    return;
  }

  const turso = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  try {
    await applyCoreSchema(turso, "turso");
  } finally {
    turso.close();
  }
}

await main();
