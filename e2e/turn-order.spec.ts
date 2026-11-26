import { expect, test } from "@playwright/test";
import { authFile, PENDING } from "./accounts";

/**
 * Signing runs in step order (legacy SSPF): only the officer whose step is
 * current may decide. Requests picked from src/mocks/signingChain.mock.ts —
 * all in manart's queue, all still รอการอนุมัติ.
 */
const WAITING_PREVIOUS = "APP-2567-001250";
const ALREADY_APPROVED = "APP-2567-001242";

test.use({ storageState: authFile("manart") });

const decisionButtons = (page: import("@playwright/test").Page) =>
  ["ส่งคืนเพื่อแก้ไข", "ไม่อนุมัติ", "อนุมัติและลงนาม"].map((name) =>
    page.getByRole("button", { name, exact: true }),
  );

test("a request that hasn't reached the officer offers no decision", async ({ page }) => {
  await page.goto(`/applications/${WAITING_PREVIOUS}`);
  await expect(page.getByRole("status")).toContainText("ยังไม่ถึงลำดับการลงนามของคุณ");
  for (const button of decisionButtons(page)) await expect(button).toHaveCount(0);
});

test("a request the officer already approved says so", async ({ page }) => {
  await page.goto(`/applications/${ALREADY_APPROVED}`);
  await expect(page.getByRole("status")).toContainText("คุณอนุมัติคำขอนี้แล้ว");
  for (const button of decisionButtons(page)) await expect(button).toHaveCount(0);
});

test("approving takes an optional remark", async ({ page }) => {
  await page.goto(`/applications/${PENDING.manart.id}`);
  await page.getByRole("button", { name: "อนุมัติและลงนาม", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/หมายเหตุ/).fill("เห็นควรอนุมัติ");
  await expect(dialog.getByText("14/512")).toBeVisible();
  await dialog.getByRole("button", { name: "ยืนยันการลงนาม" }).click();
  await expect(page.getByText(/^ลงนามสำเร็จ/)).toBeVisible();
});

test("a batch ไม่อนุมัติ needs one reason for every request", async ({ page }) => {
  await page.goto("/applications/pending");
  const boxes = page.getByRole("checkbox", { name: /^เลือกคำขอ / });
  await boxes.nth(0).click();
  await boxes.nth(1).click();
  await page.getByRole("button", { name: "ไม่อนุมัติ", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/คำขอที่เลือกไว้ 2 รายการ/)).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "ยืนยันการไม่อนุมัติ" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/รายละเอียดเพิ่มเติม/).fill("เอกสารไม่ครบ");
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByText("ไม่อนุมัติ 2 รายการเรียบร้อยแล้ว")).toBeVisible();
});
