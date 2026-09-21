import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./callback-url";

describe("safeCallbackUrl", () => {
  it("keeps an app-relative path with its query", () => {
    expect(safeCallbackUrl("/x?y=1")).toBe("/x?y=1");
    expect(safeCallbackUrl("/applications/APP-1")).toBe("/applications/APP-1");
  });

  it.each([
    undefined,
    ["/x"],
    "",
    "applications",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/x\\y",
    "javascript:alert(1)",
  ])("falls back to /applications for %j", (raw) => {
    expect(safeCallbackUrl(raw)).toBe("/applications");
  });
});
