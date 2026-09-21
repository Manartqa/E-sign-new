import { expect, test } from "@playwright/test";
import { authFile } from "./accounts";

test.use({ storageState: authFile("manart") });

test("list filters survive leaving the page and a reload, until รีเซ็ต", async ({
  page,
}) => {
  await page.goto("/applications");
  const keyword = page.locator("#keyword");
  await keyword.fill("2569");
  await page.getByRole("button", { name: "ค้นหา", exact: true }).click();

  // away through the sidebar and back
  await page.locator("aside nav").getByRole("link", { name: /รายงาน/ }).click();
  await expect(page).toHaveURL(/\/reports/);
  await page.locator("aside nav").getByRole("link", { name: /คำขอทั้งหมด/ }).click();
  await expect(keyword).toHaveValue("2569");

  await page.reload();
  await expect(keyword).toHaveValue("2569");

  // รีเซ็ต forgets them too
  await page.getByRole("button", { name: "รีเซ็ต", exact: true }).click();
  await expect(keyword).toHaveValue("");
  await page.reload();
  await expect(keyword).toHaveValue("");
});

test("saved filters are dropped once they expire", async ({ page }) => {
  await page.goto("/applications");
  await page.evaluate(() =>
    localStorage.setItem(
      "application-list-filters-all",
      JSON.stringify({ values: { keyword: "old" }, expiresAt: Date.now() - 1 }),
    ),
  );
  await page.reload();
  await expect(page.locator("#keyword")).toHaveValue("");
});

test("a remembered page past the end falls back to the last page", async ({
  page,
}) => {
  await page.goto("/applications");
  // อนุมัติ has 6 requests — one page of 10
  await page.evaluate(() =>
    localStorage.setItem(
      "application-list-filters-all",
      JSON.stringify({
        values: { status: "APPROVED", page: 2, limit: 10 },
        expiresAt: Date.now() + 60_000,
      }),
    ),
  );
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(6);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("application-list-filters-all")!).values,
    ),
  ).toMatchObject({ status: "APPROVED", page: 1 });
});
