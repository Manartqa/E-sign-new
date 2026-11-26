import { describe, expect, it } from "vitest";
import { maskEmail, mfaRequiredError, parseMfaRequired } from "./mfa";
import { SESSION_ABSOLUTE_MS, isPastAbsoluteLimit } from "./session";
import { checkMockOtp, MOCK_OTP, sendMockOtp } from "@/mocks/auth.mock";

describe("maskEmail", () => {
  it("keeps the first and last letter of the name and the domain", () => {
    expect(maskEmail("manart.pa@smartalliance.co.th")).toBe("m*******a@smartalliance.co.th");
    expect(maskEmail("ab@x.go.th")).toBe("a*@x.go.th");
  });
});

describe("MfaRequired error", () => {
  it("carries the masked address there and back", () => {
    expect(parseMfaRequired(mfaRequiredError("m***a@x.go.th"))).toBe("m***a@x.go.th");
    expect(parseMfaRequired("CredentialsSignin")).toBeNull();
    expect(parseMfaRequired(undefined)).toBeNull();
  });
});

describe("mock OTP", () => {
  it("locks after five wrong codes and starts over on a new code", () => {
    sendMockOtp("u");
    for (let i = 0; i < 4; i++) expect(checkMockOtp("u", "000000")).toBe("invalid");
    expect(checkMockOtp("u", "000000")).toBe("locked");
    sendMockOtp("u");
    expect(checkMockOtp("u", MOCK_OTP)).toBe("ok");
  });
});

describe("isPastAbsoluteLimit", () => {
  const now = 1_800_000_000_000;
  it("ends a session 8 hours after sign-in", () => {
    expect(isPastAbsoluteLimit(now - SESSION_ABSOLUTE_MS + 1, now)).toBe(false);
    expect(isPastAbsoluteLimit(now - SESSION_ABSOLUTE_MS - 1, now)).toBe(true);
  });
  it("leaves a token without a sign-in time alone", () => {
    expect(isPastAbsoluteLimit(undefined, now)).toBe(false);
  });
});
