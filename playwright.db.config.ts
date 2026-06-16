import { defineConfig, devices } from "@playwright/test";

const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e";

export default defineConfig({
  testDir: "./e2e-db",
  webServer: {
    command: "corepack pnpm dev",
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      BETTER_AUTH_URL: "http://127.0.0.1:3000",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:3000",
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
