import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidCsrfToken } from "./csrf";

const SECRET = "test-secret";
const TOKEN = "a".repeat(64);
const cookieFor = (token: string, secret = SECRET) =>
  `${token}|${createHash("sha256").update(`${token}${secret}`).digest("hex")}`;

describe("isValidCsrfToken", () => {
  it("accepts the token that matches a genuine cookie", () => {
    expect(isValidCsrfToken(cookieFor(TOKEN), TOKEN, SECRET)).toBe(true);
  });

  it("rejects a missing or different submitted token", () => {
    expect(isValidCsrfToken(cookieFor(TOKEN), undefined, SECRET)).toBe(false);
    expect(isValidCsrfToken(cookieFor(TOKEN), "", SECRET)).toBe(false);
    expect(isValidCsrfToken(cookieFor(TOKEN), "b".repeat(64), SECRET)).toBe(false);
  });

  it("rejects a cookie not signed with our secret", () => {
    expect(isValidCsrfToken(cookieFor(TOKEN, "other"), TOKEN, SECRET)).toBe(false);
    expect(isValidCsrfToken(`${TOKEN}|forged`, TOKEN, SECRET)).toBe(false);
  });

  it("rejects when the cookie or secret is missing", () => {
    expect(isValidCsrfToken(undefined, TOKEN, SECRET)).toBe(false);
    expect(isValidCsrfToken(cookieFor(TOKEN), TOKEN, undefined)).toBe(false);
  });
});
