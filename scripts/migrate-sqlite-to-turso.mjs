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

const sourceUrl = process.env.LOCAL_SQLITE_URL || "file:db/custom.db";
const targetUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!targetUrl || !authToken) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.");
}

const source = createClient({ url: sourceUrl });
const target = createClient({ url: targetUrl, authToken });

const tables = [
  "User",
  "LicenseCode",
  "Analysis",
  "Finding",
  "Quota",
  "PasswordResetToken",
  "AuditLog",
  "LlmProvider",
];

function createIfNotExists(sql) {
  return sql.replace(/^CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
}

function indexIfNotExists(sql) {
  return sql.replace(/^CREATE\s+(UNIQUE\s+)?INDEX\s+/i, (m, unique) => `CREATE ${unique || ""}INDEX IF NOT EXISTS `);
}

async function main() {
  await target.execute("PRAGMA foreign_keys = OFF");

  const schemaRows = await source.execute({
    sql: `SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type = 'table' DESC, name`,
    args: [],
  });

  for (const row of schemaRows.rows) {
    const sql = String(row.sql);
    if (row.type === "table") {
      await target.execute(createIfNotExists(sql));
    }
  }
  for (const row of schemaRows.rows) {
    const sql = String(row.sql);
    if (row.type === "index") {
      await target.execute(indexIfNotExists(sql));
    }
  }

  for (const table of tables) {
    const colsRes = await source.execute(`PRAGMA table_info("${table}")`);
    const cols = colsRes.rows.map((r) => String(r.name));
    if (cols.length === 0) continue;

    const rowsRes = await source.execute(`SELECT * FROM "${table}"`);
    const placeholders = cols.map(() => "?").join(", ");
    const quotedCols = cols.map((c) => `"${c}"`).join(", ");
    const sql = `INSERT OR REPLACE INTO "${table}" (${quotedCols}) VALUES (${placeholders})`;

    let copied = 0;
    for (const row of rowsRes.rows) {
      await target.execute({
        sql,
        args: cols.map((c) => row[c]),
      });
      copied++;
    }
    console.log(`${table}: ${copied} rows copied`);
  }

  await target.execute("PRAGMA foreign_keys = ON");
  console.log("Migration to Turso completed.");
}

try {
  await main();
} finally {
  source.close();
  target.close();
}
