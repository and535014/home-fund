import {
  expect,
  test as base,
} from "@playwright/test";
import { execFileSync } from "node:child_process";

export const test = base.extend<{ resetDatabase: void }>({
  resetDatabase: [async ({}, use) => {
    execFileSync("sh", ["e2e/setup-db.sh"], {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    await use();
  }, { auto: true }],
});

export { expect };
