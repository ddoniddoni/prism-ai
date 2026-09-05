import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: {
    // Build first with npm run build. Keep the E2E server separate from local development.
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    env: {
      AI_PROVIDER: "mock",
      AI_LIVE_ENABLED: "false",
      DATA_SOURCE: "local",
      PERSIST_ANALYSIS_HISTORY: "false",
      DEMO_DAILY_LIMIT: "1000",
    },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
