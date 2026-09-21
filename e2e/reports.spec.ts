import { expect, test } from "@playwright/test";
import { authFile } from "./accounts";

test.use({ storageState: authFile("sombat") });

test("the filter bar shows its default choices", async ({ page }) => {
  await page.goto("/reports");
  for (const [name, value] of [
    ["ปีงบประมาณ", "2569"],
    ["ไตรมาส", "ทั้งหมด"],
    ["ประเภทรายงาน", "สรุปยอดคำขอ"],
  ])
    await expect(page.getByRole("combobox", { name })).toContainText(value);
});

// regression: the KPI sparklines used to overflow into the next card
for (const width of [1280, 1480, 1920]) {
  test(`KPI sparklines stay inside their cards at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/reports");
    const cards = page.locator(".xl\\:grid-cols-4 > div");
    await expect(cards).toHaveCount(4);

    for (const card of await cards.all()) {
      const box = await card.boundingBox();
      const spark = await card.locator("svg").last().boundingBox();
      expect(box && spark).toBeTruthy();
      expect(spark!.x).toBeGreaterThanOrEqual(box!.x);
      expect(spark!.x + spark!.width).toBeLessThanOrEqual(box!.x + box!.width);
      expect(spark!.width).toBeGreaterThanOrEqual(90);
    }
  });
}
