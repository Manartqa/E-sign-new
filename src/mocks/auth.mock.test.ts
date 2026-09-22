import { describe, expect, it } from "vitest";
import { canSignIn } from "./auth.mock";
import { MOCK_ROLES } from "./roles.mock";
import { MOCK_USERS } from "./users.mock";

const officer = MOCK_USERS[0];

describe("canSignIn", () => {
  it("lets in an active user with an active role, whatever the e-mail's case", () => {
    expect(canSignIn(officer.email)).toBe(true);
    expect(canSignIn(` ${officer.email.toUpperCase()} `)).toBe(true);
  });

  it("turns away an e-mail with no ผู้ใช้งาน record", () => {
    expect(canSignIn("no.access@smartalliance.co.th")).toBe(false);
    expect(canSignIn(null)).toBe(false);
  });

  it("turns away a disabled user", () => {
    const users = [{ ...officer, isActive: false }];
    expect(canSignIn(officer.email, users)).toBe(false);
  });

  it("turns away a user whose roles are all disabled or gone", () => {
    const disabled = MOCK_ROLES.map((role) => ({ ...role, isActive: false }));
    expect(canSignIn(officer.email, MOCK_USERS, disabled)).toBe(false);
    const users = [{ ...officer, roleIds: ["RL-999"] }];
    expect(canSignIn(officer.email, users)).toBe(false);
  });

});
