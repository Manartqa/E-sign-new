import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against the dev server in mock mode (NEXT_PUBLIC_USE_MOCK
 * on). They pin today's behaviour so the switch to the real API shows what it
 * breaks. The mock never persists a decision or a signature, so every test can
 * run in any order and any number of times.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // the dev server compiles each route on first hit — keep the load gentle
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    // ActionButton plays a ~1s animation before it fires; reduced motion
    // makes it fire at once, like it does for users who ask for that
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    // the installed Google Chrome — no browser download needed; drop
    // `channel` after `npx playwright install chromium` to use the bundled one
    channel: "chrome",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chrome",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
