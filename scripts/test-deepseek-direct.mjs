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
  console.log("Fetching DeepSeek V4 Pro Direct from Turso database...");
  const t0 = Date.now();
  const provider = await db.llmProvider.findFirst({
    where: { name: { contains: "DeepSeek" } }
  });
  console.log(`Prisma DB Fetch took: ${Date.now() - t0}ms`);

  if (!provider) {
    console.error("DeepSeek provider not found in database!");
    process.exit(1);
  }

  console.log(`Provider info:
- Name: ${provider.name}
- Base URL: ${provider.baseUrl}
- Model: ${provider.model}
- API Key (first 10 chars): ${provider.apiKey.slice(0, 10)}...
- Enabled: ${provider.enabled}
`);

  console.log("Sending manual request to DeepSeek...");
  const tStart = Date.now();
  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: "You are a helpful assistant. Reply in brief." },
          { role: "user", content: "Say hello!" }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    const tHeaders = Date.now() - tStart;
    console.log(`HTTP Headers received in: ${tHeaders}ms | Status: ${res.status}`);

    const text = await res.text();
    const tBody = Date.now() - tStart;
    console.log(`Full response body received in: ${tBody}ms`);
    console.log("Response content:");
    console.log(text);
  } catch (err) {
    console.error("Error calling DeepSeek API directly:", err);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
