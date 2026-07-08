/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import {
  buildLicenseCode,
  hashLicenseCode,
  addLicenseMonths,
  isPaidPlan,
} from "./license";

describe("license helpers", () => {
  test("buildLicenseCode produces grouped uppercase redeem code", () => {
    const code = buildLicenseCode("lite", "abc123def456");
    expect(code).toBe("KP-LITE-ABC1-23DE-F456");
  });

  test("hashLicenseCode normalizes case and separators", async () => {
    const a = await hashLicenseCode("kp-lite-ABC1-23DE-F456");
    const b = await hashLicenseCode("KP LITE ABC1 23DE F456");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  test("addLicenseMonths extends from current expiry when it is still active", () => {
    const now = new Date("2026-07-08T00:00:00.000Z");
    const current = new Date("2026-08-08T00:00:00.000Z");
    const expires = addLicenseMonths(now, 1, current);
    expect(expires.toISOString()).toBe("2026-09-08T00:00:00.000Z");
  });

  test("isPaidPlan correctly identifies paid and unpaid plans", () => {
    expect(isPaidPlan("LITE")).toBe(true);
    expect(isPaidPlan("PRO")).toBe(true);
    expect(isPaidPlan("FREE")).toBe(false);
    expect(isPaidPlan("lite")).toBe(false);
    expect(isPaidPlan("pro")).toBe(false);
    expect(isPaidPlan("")).toBe(false);
    expect(isPaidPlan("PREMIUM")).toBe(false);
  });
});
