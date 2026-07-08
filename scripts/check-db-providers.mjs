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

async function main() {
  const providers = await db.llmProvider.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
  console.log("LLM Providers in DB:");
  for (const p of providers) {
    console.log(`- ID: ${p.id} | Name: ${p.name} | Provider: ${p.provider} | Model: ${p.model} | Enabled: ${p.enabled} | Priority: ${p.priority} | BaseUrl: ${p.baseUrl}`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
