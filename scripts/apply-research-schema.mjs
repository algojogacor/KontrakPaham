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

const columns = [
  ["researchEffort", "TEXT"],
  ["researchQuery", "TEXT"],
  ["researchLatencyMs", "INTEGER"],
  ["researchContent", "TEXT"],
  ["researchSources", "TEXT"],
];

async function applyColumns(client, label) {
  const existing = await client.execute('PRAGMA table_info("Analysis")');
  const names = new Set(existing.rows.map((row) => String(row.name)));

  for (const [name, type] of columns) {
    if (names.has(name)) continue;
    await client.execute(`ALTER TABLE "Analysis" ADD COLUMN "${name}" ${type}`);
    console.log(`${label}: added Analysis.${name}`);
  }
  console.log(`${label}: research schema ready`);
}

async function withClient(config, label) {
  const client = createClient(config);
  try {
    await applyColumns(client, label);
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
}
