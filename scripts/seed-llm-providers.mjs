import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { existsSync, readFileSync } from "node:fs";

function loadDotenv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1);
  }
}

function readProvidersInput() {
  const inputPath = process.argv[2];
  if (inputPath) {
    return JSON.parse(readFileSync(inputPath, "utf8"));
  }
  if (process.env.LLM_PROVIDERS_JSON) {
    return JSON.parse(process.env.LLM_PROVIDERS_JSON);
  }
  throw new Error(
    "No provider input. Pass a local JSON file path or set LLM_PROVIDERS_JSON. " +
      "Expected an array of provider configs; no keys are hardcoded in this script.",
  );
}

function normalizeProvider(raw) {
  const provider = {
    name: String(raw.name || "").trim(),
    provider: String(raw.provider || "").trim(),
    baseUrl: String(raw.baseUrl || raw.base_url || "").replace(/\/+$/, ""),
    apiKey: String(raw.apiKey || raw.api_key || raw.access_token || "").trim(),
    model: String(raw.model || "").trim(),
    enabled: raw.enabled !== false,
    priority: Number(raw.priority || 100),
    useJsonResponse: raw.useJsonResponse !== false,
    maxTokens: Number(raw.maxTokens || raw.max_tokens || 4096),
    temperature: Number(raw.temperature ?? 0.1),
    timeoutMs: Number(raw.timeoutMs || raw.timeout_ms || 90_000),
  };

  const missing = Object.entries(provider)
    .filter(([key, value]) =>
      ["name", "provider", "baseUrl", "apiKey", "model"].includes(key) && !value,
    )
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Provider "${provider.name || "(unnamed)"}" missing: ${missing.join(", ")}`);
  }
  return provider;
}

loadDotenv();

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.");
}

const db = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
});

try {
  const parsed = readProvidersInput();
  const providers = (Array.isArray(parsed) ? parsed : parsed.providers).map(normalizeProvider);

  for (const provider of providers) {
    const existing = await db.llmProvider.findFirst({
      where: { name: provider.name },
    });
    if (existing) {
      await db.llmProvider.update({ where: { id: existing.id }, data: provider });
    } else {
      await db.llmProvider.create({ data: provider });
    }
  }

  console.log(`Upserted ${providers.length} LLM provider(s) into Turso.`);
} finally {
  await db.$disconnect();
}
