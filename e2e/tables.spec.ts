import { expect, test, type Page } from "@playwright/test";
import { authFile } from "./accounts";

test.use({ storageState: authFile("manart") });

const thai = (a: string, b: string) =>
  a.localeCompare(b, "th", { numeric: true, sensitivity: "base" });

/** text of one column across the table body */
const columnText = (page: Page, index: number) =>
  page.locator("tbody tr").evaluateAll(
    (rows, i) => rows.map((row) => (row as HTMLTableRowElement).cells[i].innerText.trim()),
    index,
  );

const header = (page: Page, name: string) =>
  page.locator("thead th").filter({ has: page.getByRole("button", { name, exact: true }) });

test("sorting the requests orders every page, not just the one on screen", async ({
  page,
}) => {
  await page.goto("/applications");
  const requestNo = page.getByRole("button", { name: "เลขที่คำขอ", exact: true });

  await requestNo.click();
  await requestNo.click();
  await expect(header(page, "เลขที่คำขอ")).toHaveAttribute("aria-sort", "descending");
  // the header flips before the re-sorted rows arrive — wait for the rows
  await expect
    .poll(async () => {
      const rows = await columnText(page, 2);
      return rows.join() === [...rows].sort(thai).reverse().join();
    })
    .toBe(true);

  const firstPage = await columnText(page, 2);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(page.locator("tbody tr").first()).not.toContainText(firstPage[0]);
  const secondPage = await columnText(page, 2);

  // page 2 continues where page 1 stopped
  expect([...firstPage, ...secondPage]).toEqual(
    [...firstPage, ...secondPage].sort(thai).reverse(),
  );

  // a third click goes back to the default order
  await requestNo.click();
  await expect(header(page, "เลขที่คำขอ")).not.toHaveAttribute("aria-sort", /.*/);
});

test("a column can be dragged narrower than its default and reset", async ({
  page,
}) => {
  await page.goto("/applications");
  const typeHeader = header(page, "ประเภทคำขอ");
  const before = (await typeHeader.boundingBox())!.width;

  const handle = typeHeader.getByRole("separator");
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 150, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  const narrowed = (await typeHeader.boundingBox())!.width;
  expect(narrowed).toBeLessThan(before - 100);

  // sorting keeps the width the user chose
  await page.getByRole("button", { name: "วันที่รับเรื่อง", exact: true }).click();
  await expect(header(page, "วันที่รับเรื่อง")).toHaveAttribute("aria-sort", "ascending");
  expect((await typeHeader.boundingBox())!.width).toBeCloseTo(narrowed, 0);

  // double-click the edge: back to the default width
  await handle.dblclick();
  await expect
    .poll(async () => (await typeHeader.boundingBox())!.width)
    .toBeCloseTo(before, 0);
});

test("settings lists sort by any column", async ({ page }) => {
  await page.goto("/settings/users");
  await page.getByRole("button", { name: "ชื่อ-นามสกุล", exact: true }).click();
  await expect(header(page, "ชื่อ-นามสกุล")).toHaveAttribute("aria-sort", "ascending");
  const names = await columnText(page, 0);
  expect(names).toEqual([...names].sort(thai));
});

test("a detail-page document table sorts its own rows", async ({ page }) => {
  await page.goto("/applications/APP-2567-001234");
  await page.getByRole("button", { name: "ชื่อเอกสาร", exact: true }).first().click();
  const names = await columnText(page, 1);
  expect(names.length).toBeGreaterThan(1);
  expect(names).toEqual([...names].sort(thai));
});

test("a narrowed column never leaves a gap beside the table", async ({ page }) => {
  await page.goto("/reports");
  const card = page.locator("section").filter({
    has: page.getByRole("heading", { name: "รายการลงนามล่าสุด" }),
  });
  const table = card.locator("table");
  const handle = card.locator("thead th").first().getByRole("separator");
  // the card sits below the charts — bring it on screen before dragging
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 300, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  await expect(table).toHaveAttribute("style", /width/);
  const [tableWidth, frameWidth] = await table.evaluate((t) => [
    t.getBoundingClientRect().width,
    t.parentElement!.clientWidth,
  ]);
  expect(tableWidth).toBeGreaterThanOrEqual(frameWidth);
});
