import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3030",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    userAgent: "Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36",
  },
  webServer: {
    command: "node scripts/testing/start-e2e.mjs",
    url: "http://127.0.0.1:3030/login",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
