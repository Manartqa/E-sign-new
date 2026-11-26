import type { Page } from "@playwright/test";

/**
 * The two mock officers (src/mocks/auth.mock.ts + profile.mock.ts). They sit
 * at opposite ends of the signing chain and hold different roles:
 * - manart: ผู้ดูแลระบบ — every permission, signs mid-chain with a button
 * - sombat: ผู้มีอำนาจลงนาม — requests + reports only, signs last with a USB token
 */
export const ACCOUNTS = {
  manart: { username: "manart.pa@smartalliance.co.th", pwd: "P@ssw0rd" },
  sombat: { username: "adminsmart@smartalliance.co.th", pwd: "P@ssw0rd" },
} as const;

export type AccountName = keyof typeof ACCOUNTS;

export const authFile = (name: AccountName) => `e2e/.auth/${name}.json`;

/**
 * Requests picked from src/mocks/applications.mock.ts — both รอการอนุมัติ,
 * one in each officer's queue.
 */
export const PENDING = {
  manart: { id: "APP-2567-001234", requestNo: "40/2569" },
  sombat: { id: "APP-2567-001238", requestNo: "44/2569" },
} as const;

/** the mock's e-mailed OTP (src/mocks/auth.mock.ts MOCK_OTP) */
export const MOCK_OTP = "123456";

export async function login(page: Page, name: AccountName) {
  await page.goto("/login");
  await signInOnPage(page, name);
}

/** password, then the e-mailed OTP — on a login page already open */
export async function signInOnPage(page: Page, name: AccountName = "manart") {
  const { username, pwd } = ACCOUNTS[name];
  await page.getByPlaceholder("เช่น officer.name@agency.go.th").fill(username);
  await page.getByPlaceholder("กรอกรหัสผ่าน").fill(pwd);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.getByLabel("รหัส OTP").fill(MOCK_OTP);
  await page.getByRole("button", { name: "ยืนยันรหัส OTP" }).click();
}
