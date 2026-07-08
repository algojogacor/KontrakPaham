import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { audit } from "@/lib/logger";

const providerSchema = z.object({
  name: z.string().min(2).max(80),
  provider: z.string().min(2).max(40),
  baseUrl: z.string().url(),
  apiKey: z.string().min(8),
  model: z.string().min(1).max(160),
  enabled: z.boolean().default(true),
  priority: z.coerce.number().int().min(1).max(999).default(10),
  useJsonResponse: z.boolean().default(true),
  maxTokens: z.coerce.number().int().min(128).max(32768).default(4096),
  temperature: z.coerce.number().min(0).max(2).default(0.1),
  timeoutMs: z.coerce.number().int().min(5000).max(300000).default(90000),
});

function maskKey(key: string) {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const providers = await db.llmProvider.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      provider: p.provider,
      baseUrl: p.baseUrl,
      apiKeyMasked: maskKey(p.apiKey),
      model: p.model,
      enabled: p.enabled,
      priority: p.priority,
      useJsonResponse: p.useJsonResponse,
      maxTokens: p.maxTokens,
      temperature: p.temperature,
      timeoutMs: p.timeoutMs,
      lastStatus: p.lastStatus,
      lastLatencyMs: p.lastLatencyMs,
      lastTestedAt: p.lastTestedAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = providerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input provider tidak valid." }, { status: 400 });
  }

  const provider = await db.llmProvider.create({ data: parsed.data });
  await audit("llm_provider_created", {
    userId: admin.id,
    meta: { providerId: provider.id, name: provider.name, model: provider.model },
  });

  return NextResponse.json({
    provider: {
      ...provider,
      apiKey: undefined,
      apiKeyMasked: maskKey(provider.apiKey),
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
      lastTestedAt: provider.lastTestedAt?.toISOString() || null,
    },
  });
}
