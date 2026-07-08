import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env")) {
  const env = readFileSync(".env", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const statements = [
  `CREATE TABLE IF NOT EXISTS "AnalysisChatThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnalysisChatThread_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisChatThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AnalysisChatMessage" (
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
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AnalysisChatThread_analysisId_userId_key" ON "AnalysisChatThread"("analysisId", "userId")`,
  `CREATE INDEX IF NOT EXISTS "AnalysisChatThread_userId_updatedAt_idx" ON "AnalysisChatThread"("userId", "updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "AnalysisChatMessage_threadId_createdAt_idx" ON "AnalysisChatMessage"("threadId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AnalysisChatMessage_analysisId_createdAt_idx" ON "AnalysisChatMessage"("analysisId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AnalysisChatMessage_userId_createdAt_idx" ON "AnalysisChatMessage"("userId", "createdAt")`,
];

async function applyChatSchema(client, label) {
  for (const statement of statements) {
    await client.execute(statement);
  }
  const tables = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('AnalysisChatThread', 'AnalysisChatMessage') ORDER BY name`,
  );
  console.log(`${label}: chat schema ready (${tables.rows.map((row) => row.name).join(", ")})`);
}

async function withClient(config, label) {
  const client = createClient(config);
  try {
    await applyChatSchema(client, label);
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
