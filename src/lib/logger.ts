import { db } from "@/lib/db";
import { headers } from "next/headers";

// Lightweight audit logging + structured console logging.
// In production you'd ship these to a log aggregator.

type LogLevel = "info" | "warn" | "error";

function consoleLog(level: LogLevel, action: string, meta: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    action,
    ts: new Date().toISOString(),
    ...meta,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export async function audit(
  action: string,
  opts: {
    userId?: string | null;
    ip?: string | null;
    meta?: Record<string, unknown>;
    level?: LogLevel;
  } = {}
) {
  const level = opts.level ?? "info";
  const enrichedMeta = { ...opts.meta };
  let resolvedIp = opts.ip ?? null;

  // Auto-enrich logs with location and user-agent from headers if available
  try {
    const h = headers(); // Next.js 14 headers() is synchronous
    const userAgent = h.get("user-agent");
    const country = h.get("x-vercel-ip-country") || h.get("cf-ipcountry");
    const city = h.get("x-vercel-ip-city") || h.get("cf-ipcity");
    const forwardedFor = h.get("x-forwarded-for");

    if (userAgent) enrichedMeta.userAgent = userAgent;
    if (country) enrichedMeta.country = country;
    if (city) enrichedMeta.city = city;
    
    if (!resolvedIp && forwardedFor) {
      resolvedIp = forwardedFor.split(",")[0].trim();
    }
  } catch {
    // Ignore error if headers() is called outside a valid request context (e.g. cron)
  }

  consoleLog(level, action, {
    userId: opts.userId ?? null,
    ip: resolvedIp,
    ...enrichedMeta,
  });

  try {
    await db.auditLog.create({
      data: {
        action,
        userId: opts.userId ?? null,
        ip: resolvedIp,
        meta: Object.keys(enrichedMeta).length > 0 ? JSON.stringify(enrichedMeta) : null,
      },
    });
  } catch (e) {
    // Logging must never break the request
    console.error("audit log failed", e);
  }
}

export function logger(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  consoleLog(level, message, meta ?? {});
}

/**
 * Delete audit logs older than the retention period (default 90 days).
 * Call periodically (e.g. on signup/analyze) to prevent unbounded growth.
 * Best-effort: never throws.
 */
export async function pruneAuditLogs(retentionDays = 90): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await db.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  } catch {
    // never break the request
  }
}
