import { createHash, randomBytes } from "node:crypto";

export type PaidPlan = "LITE" | "PRO";

export function normalizeLicenseCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function buildLicenseCode(plan: string, raw = randomBytes(9).toString("hex")): string {
  const normalizedPlan = plan.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const body = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12).padEnd(12, "X");
  return `KP-${normalizedPlan}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export async function hashLicenseCode(code: string): Promise<string> {
  return createHash("sha256").update(normalizeLicenseCode(code)).digest("hex");
}

export function addLicenseMonths(now: Date, months: number, currentExpiry?: Date | null): Date {
  const base = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function isPaidPlan(plan: string): plan is PaidPlan {
  return plan === "LITE" || plan === "PRO";
}
