import { describe, expect, test } from "bun:test";
import { getPlanLimits, PLAN_LIMITS } from "./plans";

describe("plans", () => {
  describe("getPlanLimits", () => {
    test("returns correct limits for FREE plan", () => {
      expect(getPlanLimits("FREE")).toBe(PLAN_LIMITS.FREE);
    });

    test("returns correct limits for LITE plan", () => {
      expect(getPlanLimits("LITE")).toBe(PLAN_LIMITS.LITE);
    });

    test("returns correct limits for PRO plan", () => {
      expect(getPlanLimits("PRO")).toBe(PLAN_LIMITS.PRO);
    });

    test("returns correct limits for ADMIN plan", () => {
      expect(getPlanLimits("ADMIN")).toBe(PLAN_LIMITS.ADMIN);
    });

    test("falls back to FREE plan for unknown plan", () => {
      expect(getPlanLimits("UNKNOWN_PLAN")).toBe(PLAN_LIMITS.FREE);
    });

    test("falls back to FREE plan for empty string", () => {
      expect(getPlanLimits("")).toBe(PLAN_LIMITS.FREE);
    });

    test("falls back to FREE plan for lowercase known plan (since it is case-sensitive)", () => {
      expect(getPlanLimits("lite")).toBe(PLAN_LIMITS.FREE);
    });
  });
});
