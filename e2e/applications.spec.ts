import { expect, test, type Page } from "@playwright/test";
import { authFile, PENDING } from "./accounts";

test.use({ storageState: authFile("sombat") });

/** the number on a stat card, once its count-up has settled */
async function statValue(page: Page, label: string) {
  const card = page.getByRole("button").filter({ hasText: label }).first();
  const value = card.locator("span.text-\\[28px\\]");
  await expect(value).toHaveText(/^\d[\d,]*$/);
  await page.waitForTimeout(300);
  return Number((await value.innerText()).replace(/,/g, ""));
}

test("stat cards add up and the sidebar badge matches รอการอนุมัติ", async ({
  page,
}) => {
  await page.goto("/applications");
  const total = await statValue(page, "คำขอทั้งหมด");
  const pending = await statValue(page, "รอการอนุมัติ");
  const approved = await statValue(page, "อนุมัติ");
  const rejectedOrReturned = await statValue(page, "ไม่อนุมัติ/ส่งกลับแก้ไข");

  expect(total).toBeGreaterThan(0);
  expect(pending + approved + rejectedOrReturned).toBe(total);
  await expect(
    page.locator("aside nav").getByRole("link", { name: /รอการอนุมัติ/ }),
  ).toHaveText(`รอการอนุมัติ${pending}`);
});

test("the type filter lists every application type", async ({ page }) => {
  await page.goto("/applications");
  await page.getByText("ทุกประเภท", { exact: true }).click();
  const options = page.getByRole("option");
  await expect(options).toHaveCount(10);
  await expect(options.first()).toHaveText("ทุกประเภท");
});

test.describe("request detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/applications/${PENDING.sombat.id}`);
    await expect(page.getByText(PENDING.sombat.requestNo).first()).toBeVisible();
  });

  test("history follows the workflow that ends at this signer", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "ประวัติการดำเนินการ" }).click();
    await expect(page.getByText("กระบวนการลงนาม: BEK")).toBeVisible();
    await expect(page.getByText("ลงนามโดย ปล.กห.")).toBeVisible();
    await expect(page.getByText("พล.อ.สมบัติ ทองดี").last()).toBeVisible();
  });

  test("ไม่อนุมัติ needs a reason and notes, then confirms", async ({ page }) => {
    await page.getByRole("button", { name: "ไม่อนุมัติ", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("ไม่อนุมัติคำขอ")).toBeVisible();

    const confirm = dialog.getByRole("button", { name: "ยืนยันการไม่อนุมัติ" });
    await expect(confirm).toBeDisabled();
    // the first reason is picked by default
    const defaultReason = dialog.getByText(
      "คุณสมบัติผู้ยื่นไม่เป็นไปตามหลักเกณฑ์",
    );
    await expect(defaultReason).toBeVisible();

    await defaultReason.click();
    await page.getByRole("option", { name: "เอกสารหลักฐานเป็นเท็จ" }).click();
    await dialog.getByRole("textbox").fill("ทดสอบอัตโนมัติ");
    await expect(confirm).toBeEnabled();

    await confirm.click();
    await expect(page.getByText("ไม่อนุมัติคำขอแล้ว")).toBeVisible();
  });

  test("ส่งคืนเพื่อแก้ไข offers the return reasons", async ({ page }) => {
    await page
      .getByRole("button", { name: "ส่งคืนเพื่อแก้ไข", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("เอกสารแนบไม่ชัดเจน / ไม่ครบถ้วน")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "ยืนยันการส่งคืน" }),
    ).toBeDisabled();
  });
});
