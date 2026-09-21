import { expect, test } from "@playwright/test";
import { authFile } from "./accounts";

const navLinks = (page: import("@playwright/test").Page) =>
  page.locator("aside nav").getByRole("link");

test.describe("ผู้มีอำนาจลงนาม (sombat)", () => {
  test.use({ storageState: authFile("sombat") });

  test("sees no ตั้งค่าระบบ menu", async ({ page }) => {
    await page.goto("/applications");
    await expect(navLinks(page)).toHaveText([
      "คำขอทั้งหมด",
      /^รอการอนุมัติ/,
      "รายงานภาพรวม",
      "โปรไฟล์ผู้ใช้งาน",
    ]);
    await expect(page.getByRole("button", { name: "ตั้งค่าระบบ" })).toHaveCount(0);
  });

  test("is stopped at a settings page opened by URL", async ({ page }) => {
    await page.goto("/settings/signers");
    await expect(page.getByText("ไม่มีสิทธิ์เข้าถึงหน้านี้")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "เพิ่มผู้มีอำนาจลงนาม" }),
    ).toHaveCount(0);
  });

  test("still gets all three decision buttons", async ({ page }) => {
    await page.goto("/applications/APP-2567-001238");
    for (const name of ["ส่งคืนเพื่อแก้ไข", "ไม่อนุมัติ", "อนุมัติและลงนาม"])
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  });
});

test.describe("ผู้ดูแลระบบ (manart)", () => {
  test.use({ storageState: authFile("manart") });

  test("sees every settings page and its add buttons", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: "ตั้งค่าระบบ" }).click();
    await expect(navLinks(page)).toContainText([
      "ผู้มีอำนาจลงนาม",
      "กระบวนการลงนาม",
      "บทบาทและสิทธิ์",
      "ผู้ใช้งาน",
    ]);

    for (const [path, add] of [
      ["/settings/signers", "เพิ่มผู้มีอำนาจลงนาม"],
      ["/settings/signing-workflows", "เพิ่มกระบวนการลงนาม"],
      ["/settings/roles", "เพิ่มบทบาท"],
    ]) {
      await page.goto(path);
      await expect(page.getByRole("button", { name: add })).toBeVisible();
    }
  });
});
