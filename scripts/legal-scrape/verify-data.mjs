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
  const quarantineCount = await prisma.legalArticleQuarantine.count().catch(() => 0);
  console.log("=== DB STATE ===");
  console.log("LegalDocument count:", docCount);
  console.log("LegalArticle count:", articleCount);
  console.log("LegalArticleQuarantine count:", quarantineCount);

  const statusGroups = await prisma.legalDocument.groupBy({ by: ["legalStatus"], _count: true });
  console.log("\n=== LEGAL STATUS BREAKDOWN ===");
  statusGroups.forEach(g => console.log(g.legalStatus + ":", g._count));

  try {
    const fts = await prisma.$queryRawUnsafe("SELECT COUNT(*) as cnt FROM LegalArticleFts");
    console.log("\n=== FTS5 INDEX ===");
    console.log("Indexed rows:", fts[0]?.cnt ?? "unknown");
  } catch(e) {
    console.log("FTS5 check error:", e.message);
  }

  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT la.articleNumber, la.documentId, fts.text
      FROM LegalArticleFts fts
      JOIN LegalArticle la ON la.rowid = fts.rowid
      WHERE LegalArticleFts MATCH 'konsumen'
      LIMIT 2
    `);
    console.log("\n=== FTS5 SEARCH TEST ('konsumen') ===");
    res.forEach(r => console.log("-", r.articleNumber, r.documentId, "| Text snippet:", r.text.slice(0, 80)));
  } catch(e) {
    console.log("FTS5 search error:", e.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
