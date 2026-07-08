import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { audit } from "@/lib/logger";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  provider: z.string().min(2).max(40).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(8).optional(),
  model: z.string().min(1).max(160).optional(),
  enabled: z.boolean().optional(),
  priority: z.coerce.number().int().min(1).max(999).optional(),
  useJsonResponse: z.boolean().optional(),
  maxTokens: z.coerce.number().int().min(128).max(32768).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  timeoutMs: z.coerce.number().int().min(5000).max(300000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input provider tidak valid." }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.apiKey !== undefined && data.apiKey.trim() === "") delete data.apiKey;

  const provider = await db.llmProvider.update({ where: { id }, data });
  await audit("llm_provider_updated", {
    userId: admin.id,
    meta: { providerId: id, name: provider.name, model: provider.model },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const { id } = await params;
  const provider = await db.llmProvider.delete({ where: { id } });
  await audit("llm_provider_deleted", {
    userId: admin.id,
    meta: { providerId: id, name: provider.name, model: provider.model },
  });

  return NextResponse.json({ ok: true });
}
