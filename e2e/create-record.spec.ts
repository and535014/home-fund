import type { Locator, Page } from "@playwright/test";
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
  await openCreateDialog(page, "收入");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增紀錄" })).toBeVisible();
  await expectNoCreateParams(page);
  await dialog.locator('input[name="name"]').fill("E2E 新增收入");
  await dialog.locator('input[name="amountTwd"]').fill("3210");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-17");
  await selectCategory(dialog, "生活費");

  await dialog.getByRole("button", { name: "新增" }).click();

  await expect(page.getByRole("heading", {
    name: "總覽",
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
  await openCreateDialog(page, "基金支出");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增紀錄" })).toBeVisible();
  await expectNoCreateParams(page);
  await dialog.locator('input[name="name"]').fill("E2E 基金支出");
  await dialog.locator('input[name="amountTwd"]').fill("765");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-18");
  await selectCategory(dialog, "日用品");

  await dialog.getByRole("button", { name: "新增" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("E2E 基金支出")).toBeVisible();
  await expectNoCreateParams(page);
  await expect(page.getByRole("row", {
    name: /E2E 基金支出 .* 不需退款/u,
  })).toBeVisible();
});

test("creates a member-paid expense and adds reimbursement", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await openCreateDialog(page, "成員支出");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增紀錄" })).toBeVisible();
  await expectNoCreateParams(page);
  await dialog.locator('input[name="name"]').fill("E2E 成員代墊");
  await dialog.locator('input[name="amountTwd"]').fill("888");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-19");
  await selectCategory(dialog, "日用品");

  await dialog.getByRole("button", { name: "新增" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("E2E 成員代墊")).toBeVisible();
  await expectNoCreateParams(page);
  await expect(page.getByText(/成員代墊支出待處理/u)).toBeVisible();
});

test("keeps the income dialog visible after a server-side validation error", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await openCreateDialog(page, "收入");

  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="name"]').fill("E2E 無效分類");
  await dialog.locator('input[name="amountTwd"]').fill("500");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-20");
  await selectCategory(dialog, "生活費");
  await dialog.locator('input[name="categoryId"]:checked').evaluate((element) => {
    if (element instanceof HTMLInputElement) {
      element.value = "category-does-not-exist";
    }
  });

  await dialog.getByRole("button", { name: "新增" }).click();

  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "新增紀錄",
  })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("請選擇分類。");
  await expectNoCreateParams(page);
});

test("closes an open create dialog after browser reload", async ({ page }) => {
  await page.goto("/?month=2026-06");
  await openCreateDialog(page, "成員支出");

  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "新增紀錄",
  })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/month=2026-06/u);
  await expectNoCreateParams(page);
});

test("does not expose the removed standalone create-record route", async ({
  page,
}) => {
  await page.goto("/records");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();

  await page.goto("/records/new");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("keeps create-record actions on the homepage only", async ({ page }) => {
  await page.goto("/?month=2026-06");
  await expect(page.getByRole("button", { name: "新增紀錄" })).toBeVisible();

  await page.goto("/reimbursements?month=2026-06");
  await expect(page.getByRole("button", { name: "新增紀錄" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "退款", exact: true })).toBeVisible();
  await expect(page.getByText("敬請期待")).toBeVisible();

  await page.goto("/recurring?month=2026-06");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

async function openCreateDialog(page: Page, tabName: string) {
  await pressCreateRecordButton(page);
  await page.getByRole("dialog").getByRole("tab", { name: tabName }).click();
}

async function pressCreateRecordButton(page: Page) {
  const createButton = page.getByRole("button", { name: "新增紀錄" });

  await createButton.focus();
  await page.keyboard.press("Enter");
}

async function selectCategory(locator: Locator, name: string) {
  await locator.getByRole("radiogroup", { name: "分類" }).getByText(name, {
    exact: true,
  }).click();
}

async function expectNoCreateParams(page: Page) {
  await expect(page).not.toHaveURL(/[?&]create=/u);
  await expect(page).not.toHaveURL(/[?&]result=/u);
}
