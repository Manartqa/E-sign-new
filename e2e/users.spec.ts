import { expect, test, type Page } from "@playwright/test";
import { authFile } from "./accounts";

/** the ผู้ใช้งาน row that names `name` */
const userRow = (page: Page, name: string) =>
  page.locator("tbody tr").filter({ hasText: name });

test.describe("ผู้ดูแลระบบ (manart)", () => {
  test.use({ storageState: authFile("manart") });

  test("gives a user another role", async ({ page }) => {
    await page.goto("/settings/users");
    await page.getByRole("button", { name: "กำหนดบทบาท นางสาวมาลี รักงาน" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("checkbox", { name: "เจ้าหน้าที่ธุรการ" })).toBeChecked();
    await drawer.getByRole("checkbox", { name: "ผู้ดูรายงาน" }).click();
    await drawer.getByRole("button", { name: "บันทึก", exact: true }).click();

    await expect(drawer).toBeHidden();
    await expect(userRow(page, "นางสาวมาลี รักงาน")).toContainText(
      "เจ้าหน้าที่ธุรการผู้ดูรายงาน",
    );
  });

  test("needs at least one role", async ({ page }) => {
    await page.goto("/settings/users");
    await page.getByRole("button", { name: "กำหนดบทบาท นางสุดา ทองดี" }).click();

    const drawer = page.getByRole("dialog");
    await drawer.getByRole("checkbox", { name: "ผู้ดูรายงาน" }).click();
    await drawer.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect(drawer.getByText("กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท")).toBeVisible();
  });

  test("can't edit their own roles", async ({ page }) => {
    await page.goto("/settings/users");
    const own = userRow(page, "(คุณ)");
    await expect(own).toContainText("นายมานัส ประทุมชู");
    await expect(own.getByRole("button")).toHaveCount(0);
  });

  test("the profile shows their roles, and follows a role rename", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page.getByText("ผู้ดูแลระบบ", { exact: true })).toBeVisible();

    // roles live in this tab's memory — move with the sidebar, not a reload
    await page.getByRole("button", { name: "ตั้งค่าระบบ" }).click();
    await page.locator("aside nav").getByRole("link", { name: "บทบาทและสิทธิ์" }).click();
    await page.getByRole("button", { name: "แก้ไข ผู้ดูแลระบบ" }).click();
    await page.locator("#role-name").fill("ผู้ดูแลระบบสูงสุด");
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.locator("aside nav").getByRole("link", { name: "โปรไฟล์ผู้ใช้งาน" }).click();
    await expect(page.getByText("ผู้ดูแลระบบสูงสุด", { exact: true })).toBeVisible();
  });
});

test.describe("ผู้มีอำนาจลงนาม (sombat)", () => {
  test.use({ storageState: authFile("sombat") });

  test("sees their role on the profile but not the ผู้ใช้งาน page", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page.getByText("ผู้มีอำนาจลงนาม", { exact: true })).toBeVisible();

    await page.goto("/settings/users");
    await expect(page.getByText("ไม่มีสิทธิ์เข้าถึงหน้านี้")).toBeVisible();
  });
});
