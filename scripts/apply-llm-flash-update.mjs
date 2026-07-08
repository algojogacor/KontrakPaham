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
  console.log("Searching for DeepSeek provider in Turso database...");
  const provider = await db.llmProvider.findFirst({
    where: { name: { contains: "DeepSeek" } }
  });

  if (!provider) {
    console.error("DeepSeek provider not found in database!");
    process.exit(1);
  }

  console.log(`Found provider: ${provider.name} (Current Model: ${provider.model}, maxTokens: ${provider.maxTokens})`);
  
  console.log("Updating provider in database...");
  const updated = await db.llmProvider.update({
    where: { id: provider.id },
    data: {
      model: "deepseek-v4-flash",
      maxTokens: 8192,
      useJsonResponse: true
    }
  });

  console.log(`Successfully updated LLM Provider:
- ID: ${updated.id}
- Name: ${updated.name}
- Model: ${updated.model}
- maxTokens: ${updated.maxTokens}
- useJsonResponse: ${updated.useJsonResponse}
`);
}

main().catch(console.error).finally(() => db.$disconnect());
