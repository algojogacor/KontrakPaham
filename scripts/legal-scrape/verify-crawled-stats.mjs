import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq > 0) process.env[line.slice(0, eq)] = line.slice(eq + 1);
  }
}

const prisma = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
  ? new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    })
  : new PrismaClient();

async function main() {
  const docCount = await prisma.legalDocument.count();
  const articleCount = await prisma.legalArticle.count();
  console.log("=== FINAL CRAWLED DATABASE STATE ===");
  console.log("Total Legal Documents:", docCount);
  console.log("Total Legal Articles (Pasal):", articleCount);
  await prisma.$disconnect();
}

main().catch(console.error);
