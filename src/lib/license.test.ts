/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import {
  buildLicenseCode,
  hashLicenseCode,
  addLicenseMonths,
  normalizeLicenseCode,
} from "./license";

describe("license helpers", () => {
  test("normalizeLicenseCode correctly handles mixed casing, whitespaces, and punctuation", () => {
    expect(normalizeLicenseCode("kp-lite-ABC1-23DE-F456")).toBe(
      "KPLITEABC123DEF456",
    );
    expect(normalizeLicenseCode("  kp_lite_ABC1_23DE_F456  ")).toBe(
      "KPLITEABC123DEF456",
    );
    expect(normalizeLicenseCode("KP LITE ABC1 23DE F456")).toBe(
      "KPLITEABC123DEF456",
    );
    expect(normalizeLicenseCode("123-abc-XYZ")).toBe("123ABCXYZ");
    expect(normalizeLicenseCode("!@#$%^&*()_+{}|:<>?~")).toBe("");
  });

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
});
