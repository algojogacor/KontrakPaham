import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { testProvider } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.baseUrl || !body.apiKey || !body.model) {
    return NextResponse.json({ error: "Base URL, API key, dan Model wajib diisi." }, { status: 400 });
  }

  const result = await testProvider({
    name: body.name || "Test Connection",
    provider: body.provider || "openai",
    baseUrl: body.baseUrl,
    apiKey: body.apiKey,
    model: body.model,
    enabled: true,
    priority: body.priority || 10,
    useJsonResponse: body.useJsonResponse ?? false,
    maxTokens: body.maxTokens || 1024,
    temperature: body.temperature ?? 0.1,
    timeoutMs: body.timeoutMs || 30000,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
