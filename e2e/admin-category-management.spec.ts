import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("admin can open category management from the sidebar", async ({ page }) => {
  await signInAsAdmin(page);

  await page.goto("/settings/categories");

  await expect(page.getByRole("link", { name: "設定" })).toBeVisible();
  await expect(page.getByRole("link", { name: "分類" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "分類" })).toBeVisible();
  await expect(page.getByRole("button", { name: "登出" })).toBeVisible();
  await expect(page.getByRole("button", { name: "新增分類" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /啟用分類/u })).toBeVisible();
  await expect(page.getByRole("tab", { name: /封存分類/u })).toBeVisible();
  await expect(page.getByRole("button", { name: "新增收入" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "新增支出" })).toHaveCount(0);
});

test("non-admin members cannot discover or browse category management", async ({
  page,
}) => {
  await signInAsFinanceManager(page);
  await page.goto("/settings/account");
  await expect(page.getByRole("link", { name: "分類" })).toHaveCount(0);

  await page.goto("/settings/categories");
  await expect(page).toHaveURL(/\/$/u);
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
  await expect(page.getByRole("button", { name: "新增分類" })).toHaveCount(0);

  await signInAsGeneralMember(page);
  await page.goto("/settings/account");
  await expect(page.getByRole("link", { name: "分類" })).toHaveCount(0);

  await page.goto("/settings/categories");
  await expect(page).toHaveURL(/\/$/u);
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
});

test("admin creates a category without using URL state to open the modal", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/settings/categories");

  const beforeOpenUrl = page.url();
  await page.getByRole("button", { name: "新增分類" }).click();
  await expect(page).toHaveURL(beforeOpenUrl);

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增分類" })).toBeVisible();
  await dialog.getByLabel("類型").selectOption("expense");
  await dialog.getByLabel("分類名稱").fill("水電費");
  await dialog.getByRole("button", { name: "新增分類" }).click();

  await expect(page.getByText("分類已新增")).toBeVisible();
  await expect(page.getByText("水電費")).toBeVisible();
});

test("admin duplicate category names are rejected with toast feedback", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/settings/categories");

  await page.getByRole("button", { name: "新增分類" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("類型").selectOption("expense");
  await dialog.getByLabel("分類名稱").fill("日用品");
  await dialog.getByRole("button", { name: "新增分類" }).click();

  await expect(page.getByText("同類型已有啟用中的相同分類名稱。")).toBeVisible();
});

test("admin archives a category after confirmation", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/settings/categories");

  await page.getByRole("button", { name: "封存 日用品" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "封存分類" })).toBeVisible();
  await expect(dialog.getByText("目前有 2 筆歷史紀錄使用這個分類")).toBeVisible();

  await dialog.getByRole("button", { name: "確認封存" }).click();

  await expect(page.getByText("分類已封存")).toBeVisible();
  await page.getByRole("tab", { name: /封存分類/u }).click();
  await expect(page.getByText("日用品")).toBeVisible();

  await page.goto("/?month=2026-06");
  await pressCreateRecordButton(page);
  await expect(
    page.getByRole("radiogroup", { name: "分類" }).getByText("日用品", { exact: true }),
  ).toHaveCount(0);
});

async function signInAsAdmin(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-admin",
  });
}

async function signInAsFinanceManager(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
}

async function signInAsGeneralMember(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });
}

async function pressCreateRecordButton(page: Page) {
  const createButton = page.getByRole("button", { name: "新增紀錄" });

  await createButton.focus();
  await page.keyboard.press("Enter");
}
