import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Unit tests for plain functions; e2e/ belongs to Playwright. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
