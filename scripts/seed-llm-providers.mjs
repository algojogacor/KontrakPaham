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

const providers = [
  {
    name: "DeepSeek V4 Pro Direct",
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "sk-5c891350d6ce453ab1fc1f2b41fa9eef",
    model: "deepseek-v4-pro",
    enabled: true,
    priority: 1,
    useJsonResponse: false,
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 120000,
  },
  {
    name: "NVIDIA Nemotron Ultra",
    provider: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "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",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    enabled: true,
    priority: 2,
    useJsonResponse: true,
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 120000,
  },
  {
    name: "NVIDIA Nemotron Super",
    provider: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "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",
    model: "nvidia/nemotron-3-super-120b-a12b",
    enabled: true,
    priority: 3,
    useJsonResponse: true,
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 90000,
  },
  {
    name: "iamhc Qwen 397B",
    provider: "iamhc",
    baseUrl: "https://api.iamhc.cn/v1",
    apiKey: "sk-jMCjpgmh6zmdzA8WEVjaaI33O4IrD8DiWdjtJrXMO3aMa7j4",
    model: "Qwen3.5-397B-A17B",
    enabled: true,
    priority: 4,
    useJsonResponse: true,
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 90000,
  },
  {
    name: "NVIDIA Mistral Large Fast",
    provider: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "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",
    model: "mistralai/mistral-large-3-675b-instruct-2512",
    enabled: true,
    priority: 5,
    useJsonResponse: true,
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 90000,
  },
];

try {
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
  console.log(`Seeded ${providers.length} LLM providers.`);
} finally {
  await db.$disconnect();
}
