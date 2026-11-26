import { describe, expect, it } from "vitest";
import { PASSWORD_RULES } from "./Profile.config";

const ctx = { username: "manart.pa@smartalliance.co.th" };
const failed = (pwd: string) =>
  PASSWORD_RULES.filter((rule) => !rule.test(pwd, ctx)).map((rule) => rule.label);

describe("PASSWORD_RULES", () => {
  it("accepts a strong password", () => {
    expect(failed("Tr0ub4dor&3x")).toEqual([]);
  });

  it("applies the legacy rules", () => {
    expect(failed("aaaaaaaa")).toContain("ไม่ใช่ตัวอักษรเดียวกันทั้งหมด");
    expect(failed("P@ssw0rd")).toContain("ไม่ใช่รหัสผ่านที่ใช้กันทั่วไป");
    expect(failed("Manart.pa#2026")).toContain("ไม่มีชื่อผู้ใช้งานอยู่ในรหัสผ่าน");
    expect(failed(`Aa1!${"x".repeat(125)}`)).toContain("ความยาว 8–128 ตัวอักษร");
  });
});
