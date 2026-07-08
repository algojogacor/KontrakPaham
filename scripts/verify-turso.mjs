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

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = new PrismaClient({ adapter });

try {
  const [users, analyses, findings, quotas, auditLogs, llmProviders] = await Promise.all([
    db.user.count(),
    db.analysis.count(),
    db.finding.count(),
    db.quota.count(),
    db.auditLog.count(),
    db.llmProvider.count(),
  ]);
  console.log(JSON.stringify({ users, analyses, findings, quotas, auditLogs, llmProviders }));
} finally {
  await db.$disconnect();
}
