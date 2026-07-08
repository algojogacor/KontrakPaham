import { describe, it, expect } from "bun:test";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should combine simple strings", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle arrays", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("should handle objects with conditionals", () => {
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
  });

  it("should handle undefined and null", () => {
    expect(cn("class1", undefined, null, "class2")).toBe("class1 class2");
  });

  it("should merge tailwind classes properly", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("mt-2", { "mt-4": true })).toBe("mt-4");
  });

  it("should handle complex combinations", () => {
    expect(cn(
      "base-class",
      ["array-class-1", { "array-class-2": true }],
      { "conditional-1": true, "conditional-2": false },
      "p-2 p-4",
      undefined
    )).toBe("base-class array-class-1 array-class-2 conditional-1 p-4");
  });
});
