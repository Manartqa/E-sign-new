import { expect, test, type Page } from "@playwright/test";
import { authFile } from "./accounts";

/** the ผู้ใช้งาน row that names `name` */
const userRow = (page: Page, name: string) =>
  page.locator("tbody tr").filter({ hasText: name });

const save = (page: Page) =>
  page.getByRole("dialog").getByRole("button", { name: "บันทึก", exact: true }).click();

test.describe("ผู้ดูแลระบบ (manart)", () => {
  test.use({ storageState: authFile("manart") });

  test("adds a user with a role", async ({ page }) => {
    await page.goto("/settings/users");
    await page.getByRole("button", { name: "เพิ่มผู้ใช้งาน" }).click();
    const drawer = page.getByRole("dialog");

    await drawer.getByText("เลือกคำนำหน้า").click();
    await page.locator('li > button[title="นาย"]').click();
    await drawer.locator("#user-first-name").fill("ทดสอบ");
    await drawer.locator("#user-last-name").fill("ระบบ");
    await drawer.locator("#user-email").fill("test.ra@smartalliance.co.th");
    await drawer.getByRole("checkbox", { name: "ผู้ดูรายงาน" }).click();
    await save(page);

    await expect(drawer).toBeHidden();
    await expect(userRow(page, "นายทดสอบ ระบบ")).toContainText("ผู้ดูรายงาน");
  });

  test("needs an e-mail and at least one role", async ({ page }) => {
    await page.goto("/settings/users");
    await page.getByRole("button", { name: "แก้ไข นางสุดา ทองดี" }).click();
    const drawer = page.getByRole("dialog");

    await drawer.locator("#user-email").fill("");
    await drawer.getByRole("checkbox", { name: "ผู้ดูรายงาน" }).click();
    await save(page);
    await expect(drawer.getByText("กรุณากรอกอีเมล")).toBeVisible();
    await expect(drawer.getByText("กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท")).toBeVisible();
  });

  test("a user given an approval level can be put into a workflow", async ({
    page,
  }) => {
    await page.goto("/settings/users");
    await page.getByRole("button", { name: "แก้ไข นางสาวมาลี รักงาน" }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("combobox", { name: /ระดับการอนุมัติ/ }).click();
    await page.getByRole("option", { name: "ผู้ตรวจสอบ 5", exact: true }).click();
    await save(page);
    await expect(userRow(page, "นางสาวมาลี รักงาน")).toContainText("ผู้ตรวจสอบ 5");

    // users live in this tab's memory — move with the sidebar, not a reload
    await page.locator("aside nav").getByRole("link", { name: "กระบวนการลงนาม" }).click();
    await page.getByRole("button", { name: "เพิ่มกระบวนการลงนาม" }).click();
    await page.getByLabel("ค้นหาผู้มีอำนาจลงนาม").fill("มาลี");
    const pick = page.getByRole("dialog").locator("li").filter({ hasText: "นางสาวมาลี รักงาน" });
    await expect(pick).toContainText("ผู้ตรวจสอบ 5");
    await expect(pick.getByRole("checkbox")).toBeEnabled();
  });

  test("their own roles are locked and they can't delete themselves", async ({
    page,
  }) => {
    await page.goto("/settings/users");
    const own = userRow(page, "(คุณ)");
    await expect(own).toContainText("นายมานัส ประทุมชู");
    await expect(own.getByRole("button", { name: /^ลบ/ })).toHaveCount(0);

    await own.getByRole("button", { name: /^แก้ไข/ }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText("แก้ไขบทบาทของตัวเองไม่ได้")).toBeVisible();
    await expect(drawer.getByRole("checkbox", { name: "ผู้ดูแลระบบ" })).toBeDisabled();
  });

  test("a user still in a workflow can't be deleted; others can", async ({
    page,
  }) => {
    await page.goto("/settings/users");
    const confirm = () =>
      page.getByRole("dialog").getByRole("button", { name: "ลบ", exact: true }).click();

    await page.getByRole("button", { name: "ลบ พล.ท.สมศักดิ์ รักชาติ" }).click();
    await confirm();
    await expect(page.getByText(/ถูกใช้อยู่ในกระบวนการลงนาม/)).toBeVisible();
    await expect(userRow(page, "พล.ท.สมศักดิ์ รักชาติ")).toHaveCount(1);

    await page.getByRole("button", { name: "ลบ นางสุดา ทองดี" }).click();
    await confirm();
    await expect(userRow(page, "นางสุดา ทองดี")).toHaveCount(0);
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
    await save(page);
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
