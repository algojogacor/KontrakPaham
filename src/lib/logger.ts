import { db } from "@/lib/db";

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
  consoleLog(level, action, {
    userId: opts.userId ?? null,
    ip: opts.ip ?? null,
    ...opts.meta,
  });
  try {
    await db.auditLog.create({
      data: {
        action,
        userId: opts.userId ?? null,
        ip: opts.ip ?? null,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
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
