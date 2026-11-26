import { describe, expect, it } from "vitest";
import { signMethodFor } from "./sign-method";

describe("signMethodFor", () => {
  it("lets an earlier signer confirm whatever their own method is", () => {
    expect(signMethodFor(false, "USB_TOKEN")).toBe("CONFIRM");
    expect(signMethodFor(false, null)).toBe("CONFIRM");
  });

  it("follows the final signer's own method", () => {
    expect(signMethodFor(true, "USB_TOKEN")).toBe("USB_TOKEN");
    expect(signMethodFor(true, "CERTIFICATE_FILE")).toBe("CERTIFICATE_FILE");
  });

  it("refuses a final signer with no usable method", () => {
    expect(signMethodFor(true, null)).toBeNull();
    expect(signMethodFor(true, "E_DOCUMENT")).toBeNull();
  });
});
