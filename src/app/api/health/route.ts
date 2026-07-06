import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let dbOk = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }
  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    time: new Date().toISOString(),
  });
}
