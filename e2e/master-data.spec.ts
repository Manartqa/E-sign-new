import { expect, test } from "@playwright/test";
import { authFile } from "./accounts";

// option lists come from services/master.service.ts, not from the components
test.use({ storageState: authFile("manart") });

test("the workflow form lists weapon categories and licence types", async ({
  page,
}) => {
  await page.goto("/settings/signing-workflows");
  await page.getByRole("button", { name: "เพิ่มกระบวนการลงนาม" }).click();
  const drawer = page.getByRole("dialog");

  await drawer.getByText("กรุณาเลือกประเภทยุทธภัณฑ์").click();
  let options = page.getByRole("listbox").getByRole("option");
  await expect(options).toHaveCount(5);
  await expect(options.first()).toHaveText("ทุกประเภทยุทธภัณฑ์");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);

  await drawer.getByText("กรุณาเลือกประเภทใบอนุญาต").click();
  options = page.getByRole("listbox").getByRole("option");
  await expect(options).toHaveCount(10);
  await expect(options.first()).toHaveText("ทุกประเภทใบอนุญาต");
});

test("the user form lists person types and name prefixes", async ({
  page,
}) => {
  await page.goto("/settings/users");
  await page.getByRole("button", { name: "เพิ่มผู้ใช้งาน" }).click();
  const drawer = page.getByRole("dialog");

  // the default person type only shows its label once the list has loaded
  await expect(
    drawer.getByRole("combobox", { name: /ประเภทบุคคล/ }),
  ).toContainText("ผู้มีอำนาจลงนาม");

  await drawer.getByText("เลือกคำนำหน้า").click();
  await expect(page.locator("li > button[title]")).toHaveCount(23);
});
