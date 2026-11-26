import { expect, test, type Page } from "@playwright/test";
import { authFile } from "./accounts";

/** Phase 4 settings rules — see docs/legacy-sspf/FRONTEND-IMPROVEMENT-PLAN.md */
test.use({ storageState: authFile("manart") });

const save = (page: Page) =>
  page.getByRole("dialog").getByRole("button", { name: "บันทึก", exact: true }).click();

/** SW-001 — the chain the pending mock requests run on */
const WORKFLOW_IN_USE = "ส่งออก นำเรียน รอง ปล.กห. (พล.ร.อ.สุพพัต ฯ) (1 ตค.67) (ปรับปรุง 30 เม.ย.68)";

test("a chain without the ผู้ตรวจสอบและลงนาม last is refused", async ({ page }) => {
  await page.goto("/settings/signing-workflows");
  await page.getByRole("button", { name: "เพิ่มกระบวนการลงนาม" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByLabel("ค้นหาผู้มีอำนาจลงนาม").fill("ผอ.กคร.");
  await drawer.locator("li").filter({ hasText: "ผอ.กคร." }).getByRole("checkbox").click();
  await drawer.getByRole("button", { name: "เพิ่ม", exact: true }).click();
  await save(page);
  await expect(
    drawer.getByText("ต้องมีผู้ตรวจสอบและลงนาม 1 คน และต้องอยู่ลำดับสุดท้าย", { exact: true }),
  ).toBeVisible();
});

test("a workflow requests are still signed on can't be deleted", async ({ page }) => {
  await page.goto("/settings/signing-workflows");
  await page.getByRole("button", { name: `ลบ ${WORKFLOW_IN_USE}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "ลบ", exact: true }).click();
  await expect(page.getByText(/ยังมีคำขอที่อยู่ระหว่างการลงนาม/)).toBeVisible();
});

test("a ผู้ตรวจสอบและลงนาม needs a signature image and a signing method that signs", async ({
  page,
}) => {
  await page.goto("/settings/users");
  await page.getByRole("button", { name: "แก้ไข นางสาวมาลี รักงาน" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("combobox", { name: /ระดับการอนุมัติ/ }).click();
  await page.getByRole("option", { name: "ผู้ตรวจสอบและลงนาม", exact: true }).click();
  await drawer.getByRole("radio", { name: /E-Document/ }).check();
  await save(page);
  await expect(drawer.getByText("ผู้ตรวจสอบและลงนามต้องมีรูปลายเซ็นต์")).toBeVisible();
  await expect(
    drawer.getByText("ผู้ตรวจสอบและลงนามต้องลงนามด้วย USB Token หรือ Certificate File"),
  ).toBeVisible();
});

test("a workflow flags a signer whose account was switched off", async ({ page }) => {
  await page.goto("/settings/users");
  const row = page.locator("tbody tr").filter({ hasText: "ผอ.กคร." }).first();
  await row.getByRole("button", { name: /^แก้ไข/ }).click();
  await page.getByRole("dialog").getByRole("switch").first().click();
  await save(page);
  await expect(page.getByRole("dialog")).toBeHidden();

  // users live in this tab's memory — move with the sidebar, not a reload
  await page.locator("aside nav").getByRole("link", { name: "กระบวนการลงนาม" }).click();
  await expect(page.getByText("มีผู้ลงนามที่ถูกปิดใช้งาน").first()).toBeVisible();
  await page.getByRole("button", { name: `แก้ไข ${WORKFLOW_IN_USE}` }).click();
  await expect(
    page.getByRole("dialog").getByText(/ผู้ใช้งานนี้ถูกปิดใช้งานแล้ว/),
  ).toBeVisible();
});
