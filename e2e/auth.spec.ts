import { expect, test } from "@playwright/test";
import { ACCOUNTS, MOCK_OTP, signInOnPage } from "./accounts";

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

  test("a right password without an account here is turned away", async ({
    page,
  }) => {
    await page.goto("/login");
    await page
      .getByPlaceholder("เช่น officer.name@agency.go.th")
      .fill("no.access@smartalliance.co.th");
    await page.getByPlaceholder("กรอกรหัสผ่าน").fill(ACCOUNTS.manart.pwd);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(
      page.getByText("บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("returns to the page that asked for a login", async ({ page }) => {
    await page.goto("/reports/overview?m=2");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Freports%2Foverview%3Fm%3D2/);
    await signInOnPage(page);
    await expect(page).toHaveURL(/\/reports\/overview\?m=2$/);
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
    // not the bare role: Next's route announcer is an (empty) alert too
    await expect(
      page.getByRole("alert").filter({ hasText: "ถูกยกเลิกหรือไม่สำเร็จ" }),
    ).toBeVisible();
  });

  test("logout refuses GET and a POST without a valid CSRF token", async ({
    request,
  }) => {
    const get = await request.get("/api/auth/logout", { maxRedirects: 0 });
    expect(get.status()).toBe(405);

    const forms: Record<string, string>[] = [{}, { csrfToken: "forged" }];
    for (const form of forms) {
      const post = await request.post("/api/auth/logout", { form, maxRedirects: 0 });
      expect(post.status()).toBe(403);
    }
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

test.describe("OTP and session limits", () => {
  test("a right password asks for the e-mailed OTP; a wrong one is refused", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder("เช่น officer.name@agency.go.th").fill(ACCOUNTS.manart.username);
    await page.getByPlaceholder("กรอกรหัสผ่าน").fill(ACCOUNTS.manart.pwd);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page.getByText(/ส่งรหัส OTP 6 หลักไปที่อีเมล m\*+a@/)).toBeVisible();

    await page.getByLabel("รหัส OTP").fill("000000");
    await page.getByRole("button", { name: "ยืนยันรหัส OTP" }).click();
    await expect(page.getByText("รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("รหัส OTP").fill(MOCK_OTP);
    await page.getByRole("button", { name: "ยืนยันรหัส OTP" }).click();
    await expect(page).toHaveURL(/\/applications$/);
  });

  test("idling warns, then signs the app out and comes back to the page", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/login");
    await signInOnPage(page);
    await expect(page).toHaveURL(/\/applications$/);
    await page.goto("/reports");
    // the idle timer starts when the signed-in shell mounts — wait for it
    await expect(page.getByRole("heading", { name: "ยอดคำขอรายเดือน" })).toBeVisible();

    // idle limit 1 hour, warning 2 minutes before
    await page.clock.fastForward("58:30");
    await expect(page.getByText("ใกล้หมดเวลาการใช้งาน")).toBeVisible();
    await page.getByRole("button", { name: "ต่อเวลาใช้งาน" }).click();
    await expect(page.getByText("ใกล้หมดเวลาการใช้งาน")).toBeHidden();

    await page.clock.fastForward("01:00:30");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/ไม่มีการใช้งานเกิน 1 ชั่วโมง/)).toBeVisible();

    await signInOnPage(page);
    await expect(page).toHaveURL(/\/reports\/overview$/);
  });
});
