import { describe, expect, test } from "bun:test";
import { getEffectivePlan } from "./quota";

describe("getEffectivePlan", () => {
  test("returns ADMIN if user plan is ADMIN", () => {
    expect(getEffectivePlan({ plan: "ADMIN" })).toBe("ADMIN");
  });

  test("returns FREE if user plan is FREE", () => {
    expect(getEffectivePlan({ plan: "FREE" })).toBe("FREE");
    expect(
      getEffectivePlan({
        plan: "FREE",
        planExpiresAt: new Date(Date.now() + 100000),
      }),
    ).toBe("FREE");
  });

  test("returns FREE if planExpiresAt is not provided", () => {
    expect(getEffectivePlan({ plan: "PRO" })).toBe("FREE");
    expect(getEffectivePlan({ plan: "PRO", planExpiresAt: null })).toBe("FREE");
  });

  test("returns the user plan if planExpiresAt is in the future (Date object)", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(getEffectivePlan({ plan: "PRO", planExpiresAt: futureDate })).toBe(
      "PRO",
    );
  });

  test("returns the user plan if planExpiresAt is in the future (string)", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(
      getEffectivePlan({
        plan: "PRO",
        planExpiresAt: futureDate.toISOString(),
      }),
    ).toBe("PRO");
  });

  test("returns FREE if planExpiresAt is in the past (Date object)", () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    expect(getEffectivePlan({ plan: "PRO", planExpiresAt: pastDate })).toBe(
      "FREE",
    );
  });

  test("returns FREE if planExpiresAt is in the past (string)", () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    expect(
      getEffectivePlan({ plan: "PRO", planExpiresAt: pastDate.toISOString() }),
    ).toBe("FREE");
  });
});
