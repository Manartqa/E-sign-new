import { describe, expect, it } from "vitest";
import { isVersionAtLeast } from "./version";

describe("isVersionAtLeast", () => {
  it("compares each part as a number", () => {
    expect(isVersionAtLeast("1.10.0", "1.9.2")).toBe(true);
    expect(isVersionAtLeast("1.2.0", "1.10.0")).toBe(false);
  });

  it("accepts the minimum itself, missing parts and a v prefix", () => {
    expect(isVersionAtLeast("1.0.0", "1.0.0")).toBe(true);
    expect(isVersionAtLeast("1.0", "1.0.0")).toBe(true);
    expect(isVersionAtLeast("v2.1", "2.0.9")).toBe(true);
  });

  it("treats an unparsable version as too old", () => {
    expect(isVersionAtLeast("dev", "1.0.0")).toBe(false);
  });
});
