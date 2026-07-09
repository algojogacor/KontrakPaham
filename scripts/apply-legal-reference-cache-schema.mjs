import { createClient } from "@libsql/client";
import { existsSync, mkdirSync, readFileSync } from "node:fs";

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
  `CREATE TABLE IF NOT EXISTS "LegalReferenceCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT,
    "latencyMs" INTEGER,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LegalReferenceCache_cacheKey_key" ON "LegalReferenceCache"("cacheKey")`,
  `CREATE INDEX IF NOT EXISTS "LegalReferenceCache_effort_updatedAt_idx" ON "LegalReferenceCache"("effort", "updatedAt")`,
];

async function applyLegalReferenceCacheSchema(client, label) {
  for (const statement of statements) {
    await client.execute(statement);
  }
  console.log(`${label}: legal reference cache schema ready`);
}

async function withClient(config, label) {
  const client = createClient(config);
  try {
    await applyLegalReferenceCacheSchema(client, label);
  } finally {
    client.close();
  }
}

const localUrl = process.env.LOCAL_SQLITE_URL || "file:db/custom.db";
if (localUrl.startsWith("file:db/")) {
  mkdirSync("db", { recursive: true });
}
await withClient({ url: localUrl }, "local");

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  await withClient(
    { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN },
    "turso",
  );
} else {
  console.log("turso: skipped (TURSO_DATABASE_URL/TURSO_AUTH_TOKEN missing)");
}

console.log("Done. Legal reference cache schema applied.");
