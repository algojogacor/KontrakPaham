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

const columns = [
  ["textHash", "TEXT"],
  ["cacheKey", "TEXT"],
  ["cacheHit", "INTEGER NOT NULL DEFAULT 0"],
  ["cacheSourceId", "TEXT"],
  ["analysisVersion", "TEXT"],
];

const indexes = [
  `CREATE INDEX IF NOT EXISTS "Analysis_userId_cacheKey_status_idx" ON "Analysis"("userId", "cacheKey", "status")`,
  `CREATE INDEX IF NOT EXISTS "Analysis_userId_textHash_status_idx" ON "Analysis"("userId", "textHash", "status")`,
];

async function applyAnalysisCacheSchema(client, label) {
  const existing = await client.execute('PRAGMA table_info("Analysis")');
  if (existing.rows.length === 0) {
    console.log(`${label}: skipped - Analysis table not found`);
    return;
  }
  const names = new Set(existing.rows.map((row) => String(row.name)));

  for (const [name, type] of columns) {
    if (names.has(name)) {
      console.log(`${label}: Analysis.${name} already present`);
      continue;
    }
    await client.execute(`ALTER TABLE "Analysis" ADD COLUMN "${name}" ${type}`);
    console.log(`${label}: added Analysis.${name}`);
  }

  for (const statement of indexes) {
    await client.execute(statement);
    console.log(`${label}: ensured index ${statement.match(/"([^"]+)"/)?.[1] || ""}`);
  }

  console.log(`${label}: analysis cache schema ready`);
}

async function withClient(config, label) {
  const client = createClient(config);
  try {
    await applyAnalysisCacheSchema(client, label);
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

console.log("Done. Analysis cache schema applied.");
