import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
});

test("creates an income record through the browser", async ({ page }) => {
  await page.goto("/?month=2026-06");
  await expectNoCreateParams(page);
  await page.getByRole("button", { name: "新增收入" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增收入" })).toBeVisible();
  await expectNoCreateParams(page);
  await dialog.locator('input[name="name"]').fill("E2E 新增收入");
  await dialog.locator('input[name="amountTwd"]').fill("3210");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-17");
  await selectFieldOption(page, "分類", "生活費");

  await dialog.getByRole("button", { name: "新增收入" }).click();

  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("E2E 新增收入")).toBeVisible();
  await expect(page).toHaveURL(/month=2026-06/u);
  await expectNoCreateParams(page);
});

test("creates a fund-paid expense without adding reimbursement", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await page.getByRole("button", { name: "新增支出" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增支出" })).toBeVisible();
  await expectNoCreateParams(page);
  await selectFieldOption(page, "支出類型", "基金支出");
  await dialog.locator('input[name="name"]').fill("E2E 基金支出");
  await dialog.locator('input[name="amountTwd"]').fill("765");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-18");
  await selectFieldOption(page, "分類", "日用品");

  await dialog.getByRole("button", { name: "新增支出" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("E2E 基金支出")).toBeVisible();
  await expectNoCreateParams(page);
  await page.goto("/reimbursements?month=2026-06");
  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );
  await expect(reimbursementRegion.getByText("Lin")).toHaveCount(0);
});

test("creates a member-paid expense and adds reimbursement", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await page.getByRole("button", { name: "新增支出" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增支出" })).toBeVisible();
  await expectNoCreateParams(page);
  await dialog.locator('input[name="name"]').fill("E2E 成員代墊");
  await dialog.locator('input[name="amountTwd"]').fill("888");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-19");
  await selectFieldOption(page, "分類", "日用品");

  await dialog.getByRole("button", { name: "新增支出" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("E2E 成員代墊")).toBeVisible();
  await expectNoCreateParams(page);
  await page.goto("/reimbursements?month=2026-06");
  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );
  await expect(reimbursementRegion.getByText("Lin", { exact: true })).toBeVisible();
});

test("keeps the income dialog visible after a server-side validation error", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await page.getByRole("button", { name: "新增收入" }).first().click();

  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="name"]').fill("E2E 缺少分類");
  await dialog.locator('input[name="amountTwd"]').fill("500");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-20");

  await dialog.getByRole("button", { name: "新增收入" }).click();

  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "新增收入",
  })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("請選擇分類。");
  await expectNoCreateParams(page);
});

test("closes an open create dialog after browser reload", async ({ page }) => {
  await page.goto("/records?month=2026-06");
  await page.getByRole("button", { name: "新增支出" }).first().click();

  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "新增支出",
  })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/month=2026-06/u);
  await expectNoCreateParams(page);
});

test("does not expose the removed standalone create-record route", async ({
  page,
}) => {
  await page.goto("/records/new");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

async function selectFieldOption(page: Page, label: string, option: string) {
  await page
    .getByText(label, { exact: true })
    .locator("..")
    .getByRole("combobox")
    .selectOption({ label: option });
}

async function expectNoCreateParams(page: Page) {
  await expect(page).not.toHaveURL(/[?&]create=/u);
  await expect(page).not.toHaveURL(/[?&]result=/u);
}
