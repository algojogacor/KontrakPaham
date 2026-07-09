-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "planExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LicenseCode" (
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
);

-- CreateTable
CREATE TABLE "LlmProvider" (
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
);

-- CreateTable
CREATE TABLE "LegalReferenceCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentBytes" INTEGER NOT NULL DEFAULT 0,
    "sources" TEXT,
    "latencyMs" INTEGER,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Analysis" (
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
);

-- CreateTable
CREATE TABLE "AnalysisChatThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnalysisChatThread_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisChatThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "modelUsed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalysisChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "AnalysisChatThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisChatMessage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Finding" (
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
);

-- CreateTable
CREATE TABLE "Quota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "analysesUsed" INTEGER NOT NULL DEFAULT 0,
    "analysesLimit" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ip" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LegalDocument" (
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
    "legalStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "amendedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LegalArticle" (
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
);

-- CreateTable
CREATE TABLE "LegalArticleQuarantine" (
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
);

-- CreateTable
CREATE TABLE "LegalArticleIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tag" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "LegalArticleIndex_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LegalArticle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseCode_codeHash_key" ON "LicenseCode"("codeHash");

-- CreateIndex
CREATE INDEX "LicenseCode_plan_idx" ON "LicenseCode"("plan");

-- CreateIndex
CREATE INDEX "LicenseCode_createdAt_idx" ON "LicenseCode"("createdAt");

-- CreateIndex
CREATE INDEX "LicenseCode_redeemedById_idx" ON "LicenseCode"("redeemedById");

-- CreateIndex
CREATE INDEX "LlmProvider_enabled_priority_idx" ON "LlmProvider"("enabled", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "LegalReferenceCache_cacheKey_key" ON "LegalReferenceCache"("cacheKey");

-- CreateIndex
CREATE INDEX "LegalReferenceCache_effort_updatedAt_idx" ON "LegalReferenceCache"("effort", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_shareToken_key" ON "Analysis"("shareToken");

-- CreateIndex
CREATE INDEX "Analysis_userId_createdAt_idx" ON "Analysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Analysis_userId_cacheKey_status_idx" ON "Analysis"("userId", "cacheKey", "status");

-- CreateIndex
CREATE INDEX "Analysis_userId_textHash_status_idx" ON "Analysis"("userId", "textHash", "status");

-- CreateIndex
CREATE INDEX "AnalysisChatThread_userId_updatedAt_idx" ON "AnalysisChatThread"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisChatThread_analysisId_userId_key" ON "AnalysisChatThread"("analysisId", "userId");

-- CreateIndex
CREATE INDEX "AnalysisChatMessage_threadId_createdAt_idx" ON "AnalysisChatMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisChatMessage_analysisId_createdAt_idx" ON "AnalysisChatMessage"("analysisId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisChatMessage_userId_createdAt_idx" ON "AnalysisChatMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Finding_analysisId_idx" ON "Finding"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "Quota_userId_month_year_key" ON "Quota"("userId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "LegalDocument_type_year_idx" ON "LegalDocument"("type", "year");

-- CreateIndex
CREATE INDEX "LegalDocument_sourceHost_idx" ON "LegalDocument"("sourceHost");

-- CreateIndex
CREATE UNIQUE INDEX "LegalArticle_contentHash_key" ON "LegalArticle"("contentHash");

-- CreateIndex
CREATE INDEX "LegalArticle_documentId_articleNumber_idx" ON "LegalArticle"("documentId", "articleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LegalArticleQuarantine_contentHash_key" ON "LegalArticleQuarantine"("contentHash");

-- CreateIndex
CREATE INDEX "LegalArticleQuarantine_documentId_articleNumber_idx" ON "LegalArticleQuarantine"("documentId", "articleNumber");

-- CreateIndex
CREATE INDEX "LegalArticleIndex_token_idx" ON "LegalArticleIndex"("token");

-- CreateIndex
CREATE INDEX "LegalArticleIndex_tag_idx" ON "LegalArticleIndex"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "LegalArticleIndex_articleId_token_key" ON "LegalArticleIndex"("articleId", "token");

