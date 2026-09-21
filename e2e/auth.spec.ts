import { expect, test } from "@playwright/test";
import { ACCOUNTS } from "./accounts";

test.describe("sign-in", () => {
  test("a guest is sent to the login page", async ({ page }) => {
    await page.goto("/applications");
    await expect(page).toHaveURL(/\/login/);
  });

  test("a wrong password shows the error", async ({ page }) => {
    await page.goto("/login");
    await page
      .getByPlaceholder("เช่น officer.name@agency.go.th")
      .fill(ACCOUNTS.manart.username);
    await page.getByPlaceholder("กรอกรหัสผ่าน").fill("wrong-password");
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page.getByText("อีเมลหรือรหัสผ่านไม่ถูกต้อง")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
