import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listModels } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { baseUrl, apiKey } = body || {};

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "Base URL dan API key wajib diisi." }, { status: 400 });
  }

  try {
    const result = await listModels(baseUrl, apiKey);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
