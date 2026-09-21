import { expect, test, type Page } from "@playwright/test";
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

  test("returns to the page that asked for a login", async ({ page }) => {
    await page.goto("/reports?m=2");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Freports%3Fm%3D2/);
    await signInOnPage(page);
    await expect(page).toHaveURL(/\/reports\?m=2$/);
  });

  for (const evil of ["https://evil.com", "//evil.com"]) {
    test(`ignores callbackUrl=${evil}`, async ({ page }) => {
      await page.goto(`/login?callbackUrl=${encodeURIComponent(evil)}`);
      await signInOnPage(page);
      await expect(page).toHaveURL(/localhost:3000\/applications$/);
    });
  }

  test("a cancelled SSO sign-in shows a Thai message", async ({ page }) => {
    await page.goto("/login?error=OAuthCallback");
    await expect(page.getByRole("alert")).toContainText("ถูกยกเลิกหรือไม่สำเร็จ");
  });

  test("a cross-site logout request is refused", async ({ request }) => {
    const res = await request.get("/api/auth/logout", {
      headers: { "Sec-Fetch-Site": "cross-site" },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });
});

test.describe("sign-out", () => {
  test("lands on /login, stays there and needs a new login", async ({ page }) => {
    await page.goto("/login");
    await signInOnPage(page);
    await expect(page).toHaveURL(/\/applications$/);

    await page.getByRole("button", { name: "ออกจากระบบ" }).first().click();
    await expect(page).toHaveURL(/\/login$/);

    // A session request still in flight during logout may write the cookie
    // back; what must hold is that the session is dead, not that the cookie
    // is already gone.
    const session = await page.request.get("/api/auth/session");
    expect(await session.json()).toEqual({});

    await page.goto("/applications");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });
});

async function signInOnPage(page: Page) {
  const { username, pwd } = ACCOUNTS.manart;
  await page.getByPlaceholder("เช่น officer.name@agency.go.th").fill(username);
  await page.getByPlaceholder("กรอกรหัสผ่าน").fill(pwd);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
}
