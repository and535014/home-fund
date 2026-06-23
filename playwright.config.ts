import { defineConfig, devices } from "@playwright/test";

const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e";
const e2ePort = process.env.E2E_PORT ?? "3100";
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  webServer: {
    command: `E2E_PORT=${e2ePort} sh e2e/run-next-dev.sh`,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      BETTER_AUTH_URL: e2eBaseUrl,
      MEMBER_BINDING_TOKEN_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: e2eBaseUrl,
  },
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
