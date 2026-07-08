import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const db = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
  ? new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    })
  : new PrismaClient();

async function listModels(name, baseUrl, apiKey) {
  console.log(`\nFetching models from ${name} (${baseUrl})...`);
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.log(`Failed to fetch models: ${res.status}`);
      return;
    }
    const json = await res.json();
    const models = Array.isArray(json?.data) ? json.data.map(m => m.id) : [];
    console.log(`Available models (${models.length}):`);
    console.log(models.slice(0, 20).join(", ") + (models.length > 20 ? "..." : ""));
  } catch (err) {
    console.log(`Error querying models for ${name}:`, err.message);
  }
}

async function main() {
  const providers = await db.llmProvider.findMany();
  for (const p of providers) {
    await listModels(p.name, p.baseUrl, p.apiKey);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
