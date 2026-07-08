import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { listModels } from "@/lib/llm";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const { id } = await params;
  const provider = await db.llmProvider.findUnique({ where: { id } });
  if (!provider) return NextResponse.json({ error: "Provider tidak ditemukan." }, { status: 404 });

  try {
    const result = await listModels(provider.baseUrl, provider.apiKey);
    await db.llmProvider.update({
      where: { id },
      data: {
        lastStatus: `/models OK (${result.models.length})`,
        lastLatencyMs: result.latencyMs,
        lastTestedAt: new Date(),
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    await db.llmProvider.update({
      where: { id },
      data: {
        lastStatus: (e as Error).message.slice(0, 160),
        lastLatencyMs: null,
        lastTestedAt: new Date(),
      },
    });
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
