import { expect, test, type Page } from "@playwright/test";
import { authFile, PENDING } from "./accounts";

test.describe("final signer (sombat) signs with the USB token", () => {
  test.use({ storageState: authFile("sombat") });

  test("a wrong PIN is refused, the right one signs", async ({ page }) => {
    await page.goto(`/applications/${PENDING.sombat.id}`);
    await page
      .getByRole("button", { name: "อนุมัติและลงนาม", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/ผู้ลงนามลำดับสุดท้าย/)).toBeVisible();
    await expect(dialog.getByText("SafeNet eToken 5110")).toBeVisible();

    const pin = dialog.getByLabel("รหัส PIN ของ USB Token");
    const sign = dialog.getByRole("button", { name: "ลงนามด้วย USB Token" });

    await pin.fill("000000");
    await sign.click();
    await expect(dialog.getByText("รหัส PIN ไม่ถูกต้อง")).toBeVisible();

    await pin.fill("123456"); // MOCK_TOKEN_PIN
    await sign.click();
    await expect(page.getByText("ลงนามสำเร็จ!")).toBeVisible();
  });
});

test.describe("final signer (sombat) without a usable signing agent", () => {
  test.use({ storageState: authFile("sombat") });

  /** the mock agent's situation — see readMockAgentScenario */
  const playAgent = (page: Page, scenario: string) =>
    page.evaluate((value) => localStorage.setItem("mock-signing-agent", value), scenario);

  const openSignDialog = async (page: Page) => {
    await page.goto(`/applications/${PENDING.sombat.id}`);
    await page
      .getByRole("button", { name: "อนุมัติและลงนาม", exact: true })
      .click();
    return page.getByRole("dialog");
  };

  test("installs the agent the first time, then carries on by itself", async ({
    page,
  }) => {
    await page.goto("/applications");
    await playAgent(page, "missing");
    const dialog = await openSignDialog(page);

    await expect(dialog.getByText("ติดตั้งโปรแกรมลงนาม")).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: "ดาวน์โหลดตัวติดตั้ง" }),
    ).toHaveAttribute("href", /esign-agent-setup\.exe$/);
    await expect(dialog.getByLabel("รหัส PIN ของ USB Token")).toHaveCount(0);

    // the installer ran — no button press, the dialog finds it on its own
    await playAgent(page, "ready");
    await expect(dialog.getByText("SafeNet eToken 5110")).toBeVisible();
    await expect(dialog.getByLabel("รหัส PIN ของ USB Token")).toBeVisible();
  });

  test("an old agent is asked to update", async ({ page }) => {
    await page.goto("/applications");
    await playAgent(page, "outdated");
    const dialog = await openSignDialog(page);
    await expect(dialog.getByText("ต้องอัปเดตโปรแกรมลงนาม")).toBeVisible();
    await expect(dialog.getByText(/เวอร์ชันบนเครื่องนี้คือ 0\.9\.0/)).toBeVisible();
  });

  test("a missing SafeNet driver is named", async ({ page }) => {
    await page.goto("/applications");
    await playAgent(page, "noDriver");
    const dialog = await openSignDialog(page);
    await expect(dialog.getByText("ไม่พบไดรเวอร์ SafeNet")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "ลงนามด้วย USB Token" }),
    ).toBeDisabled();
  });
});

test.describe("mid-chain signer (manart) signs with a button", () => {
  test.use({ storageState: authFile("manart") });

  test("confirming signs without a token", async ({ page }) => {
    await page.goto(`/applications/${PENDING.manart.id}`);
    await page
      .getByRole("button", { name: "อนุมัติและลงนาม", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("รหัส PIN ของ USB Token")).toHaveCount(0);
    await dialog.getByRole("button", { name: "ยืนยันการลงนาม" }).click();
    await expect(page.getByText("ลงนามสำเร็จ!")).toBeVisible();
  });
});
