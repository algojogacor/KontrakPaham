/**
 * Apply shareToken column to Analysis table (local SQLite + Turso remote).
 * Run: node scripts/apply-share-schema.mjs
 */
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
  `ALTER TABLE "Analysis" ADD COLUMN "shareToken" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Analysis_shareToken_key" ON "Analysis"("shareToken")`,
];

async function applyShareSchema(client, label) {
  for (const statement of statements) {
    try {
      await client.execute(statement);
      console.log(`${label}: OK — ${statement.slice(0, 60)}...`);
    } catch (e) {
      // Column already exists — idempotent
      if (e.message && (e.message.includes("duplicate column") || e.message.includes("already exists"))) {
        console.log(`${label}: already applied — ${statement.slice(0, 60)}...`);
      } else {
        throw e;
      }
    }
  }
  const cols = await client.execute(`PRAGMA table_info("Analysis")`);
  const hasShareToken = cols.rows.some((r) => r.name === "shareToken");
  console.log(`${label}: shareToken column present = ${hasShareToken}`);
}

async function withClient(config, label) {
  const client = createClient(config);
  try {
    await applyShareSchema(client, label);
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

console.log("Done. Share schema applied.");
