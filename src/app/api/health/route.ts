import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiOk } from "@/lib/api-response";

export async function GET() {
  // Check each dependency
  const checks: Record<string, boolean> = {};

  // Database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  // OCR env config (non-fatal if missing — OCR just won't work)
  checks.minimax_configured = Boolean(process.env.MINIMAX_API_KEY);
  checks.llm_configured = Boolean(process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL);
  checks.you_research_configured = Boolean(process.env.YOU_API_KEY && process.env.YOU_RESEARCH_URL);

  // Auth config
  checks.jwt_configured = Boolean(process.env.JWT_SECRET);

  const allOk = Object.values(checks).every(Boolean);
  const status = allOk ? "ok" : "degraded";

  return apiOk({
    status,
    checks,
    time: new Date().toISOString(),
  });
}
