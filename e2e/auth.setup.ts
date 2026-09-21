import { expect, test as setup } from "@playwright/test";
import { authFile, login, type AccountName } from "./accounts";

// sign each account in once; the specs reuse the saved session
for (const name of ["manart", "sombat"] as AccountName[]) {
  setup(`sign in as ${name}`, async ({ page }) => {
    await login(page, name);
    await expect(page).toHaveURL(/\/applications$/);
    await page.context().storageState({ path: authFile(name) });
  });
}
