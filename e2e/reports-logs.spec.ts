import { expect, test } from "@playwright/test";
import { authFile } from "./accounts";

/** Phase 6 — the signature report and the two log screens (manart: every permission) */
test.use({ storageState: authFile("manart") });

const SOMBAT = "พล.อ.สมบัติ ทองดี";

test("the signature report needs an officer", async ({ page }) => {
  await page.goto("/reports/signature-verification");
  await page.getByRole("button", { name: "ค้นหา", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "กรุณาเลือกเจ้าหน้าที่ตรวจสอบ/ลงนาม" })).toBeVisible();
});

test("the signature report groups a day's decisions with their totals", async ({ page }) => {
  // the report opens on today – today: pin "today" to a day sombat decided on
  await page.clock.setFixedTime(new Date("2026-06-15T12:00:00+07:00"));
  await page.goto("/reports/signature-verification");
  await page.getByRole("button", { name: "เจ้าหน้าที่ตรวจสอบ/ลงนาม" }).click();
  await page.getByLabel("ค้นหาชื่อ หรือตำแหน่ง").fill("สมบัติ");
  await page.getByRole("button", { name: new RegExp(SOMBAT) }).click();
  await page.getByRole("button", { name: "ค้นหา", exact: true }).click();

  await expect(page.getByText(`เจ้าหน้าที่: ${SOMBAT}`, { exact: false })).toBeVisible();
  await expect(page.getByRole("cell", { name: /^วันที่ 15/ })).toBeVisible();
  await expect(page.getByText(/^รวมทั้งหมด \d+ รายการ: ผ่าน \d+ · ไม่ผ่าน \d+ · ส่งคืน \d+$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "พิมพ์ / บันทึก PDF" })).toBeEnabled();
});

test("the logon log filters by event and exports CSV", async ({ page }) => {
  await page.goto("/settings/logs/logon");
  await page.getByRole("combobox", { name: "เหตุการณ์" }).click();
  await page.getByRole("option", { name: "เข้าสู่ระบบไม่สำเร็จ" }).click();
  await page.getByRole("button", { name: "ค้นหา", exact: true }).click();

  const events = page.locator("tbody tr td:nth-child(4)");
  await expect(events.first()).toHaveText("เข้าสู่ระบบไม่สำเร็จ");
  for (const text of await events.allInnerTexts()) expect(text).toBe("เข้าสู่ระบบไม่สำเร็จ");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "ส่งออก CSV" }).click();
  expect((await download).suggestedFilename()).toMatch(/^logon-log-\d{4}-\d{2}-\d{2}\.csv$/);
});

test("the change log lists decisions on requests", async ({ page }) => {
  await page.goto("/settings/logs/changes");
  await page.getByLabel("ค้นหา", { exact: true }).fill("ส่งคืนเพื่อแก้ไข");
  await page.getByRole("button", { name: "ค้นหา", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("ส่งคืนเพื่อแก้ไข");
});

test.describe("ผู้มีอำนาจลงนาม (sombat)", () => {
  test.use({ storageState: authFile("sombat") });

  test("has no log permission", async ({ page }) => {
    await page.goto("/settings/logs/logon");
    await expect(page.getByText("ไม่มีสิทธิ์เข้าถึงหน้านี้")).toBeVisible();
  });
});
