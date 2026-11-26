import { expect, test } from "@playwright/test";
import { authFile } from "./accounts";

/**
 * Legacy-parity additions to the list and detail pages. Requests picked from
 * src/mocks — all in manart's queue.
 */
const FACTORY_LICENSE = "APP-2567-001234"; // อ.1/อ.3
const MOVE = "APP-2567-001235"; // อ.9
const SECOND_ROUND = "APP-2567-001242"; // sent back once, resubmitted

test.use({ storageState: authFile("manart") });

test("the list shows วันที่คำขอ and ส่งไปยัง/ขายให้กับ", async ({ page }) => {
  await page.goto("/applications");
  for (const name of ["วันที่คำขอ", "ส่งไปยัง/ขายให้กับ"])
    await expect(page.getByRole("columnheader", { name })).toBeVisible();
});

test("an อ.1/อ.3 request has ผลการตรวจสอบ with the three meetings", async ({ page }) => {
  await page.goto(`/applications/${FACTORY_LICENSE}`);
  await page.getByRole("tab", { name: "ผลการตรวจสอบ" }).click();
  await expect(page.getByText("ผลการตรวจสอบสถานที่ตั้งโรงงาน")).toBeVisible();
  await expect(page.getByText("ผลการประชุม คพอท.")).toBeVisible();
});

test("an อ.9 request has its move details and no อาคาร tab", async ({ page }) => {
  await page.goto(`/applications/${MOVE}`);
  await expect(page.getByRole("tab", { name: "อาคารและสถานที่" })).toHaveCount(0);
  await page.getByRole("tab", { name: "ข้อมูลการขนย้าย" }).click();
  await expect(page.getByText("ขนย้ายไปยัง")).toBeVisible();
});

test("history switches between ครั้งที่", async ({ page }) => {
  await page.goto(`/applications/${SECOND_ROUND}`);
  await page.getByRole("tab", { name: "ประวัติการดำเนินการ" }).click();
  await expect(page.getByText("ส่งกลับแก้ไขโดย")).toHaveCount(0);

  await page.getByRole("combobox", { name: "ครั้งที่" }).click();
  await page.getByRole("option", { name: "1", exact: true }).click();
  await expect(page.getByText(/^ส่งกลับแก้ไขโดย/)).toBeVisible();
  await expect(page.getByText(/^หมายเหตุ:/)).toBeVisible();
});
