import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
});

test("edits and voids an own ledger record from the dashboard detail", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await createFundPaidExpense(page, "E2E 可編輯刪除");

  await page.getByRole("button", { name: "查看E2E 可編輯刪除詳情" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "編輯" }).click();

  const editDialog = page.getByRole("dialog");
  await expect(editDialog.getByRole("heading", { name: "編輯紀錄" })).toBeVisible();
  await editDialog.locator('input[name="name"]').fill("E2E 已更新刪除");
  await editDialog.locator('input[name="amountTwd"]').fill("4321");
  await editDialog.locator('input[name="occurredOn"]').fill("2026-06-21");
  await editDialog.locator('select[name="categoryId"]').selectOption({
    label: "網路費",
  });
  await editDialog.locator('textarea[name="note"]').fill("E2E 編輯後備註");
  await editDialog.getByRole("button", { name: "儲存變更" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("紀錄已更新", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E 已更新刪除")).toBeVisible();

  await page.getByRole("button", { name: "查看E2E 已更新刪除詳情" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "刪除" }).click();

  const deleteDialog = page.getByRole("dialog");
  await expect(deleteDialog.getByRole("heading", { name: "刪除紀錄" })).toBeVisible();
  await expect(deleteDialog).toContainText("E2E 已更新刪除");
  await expectFooterSpacing(deleteDialog);

  await deleteDialog.getByRole("button", { name: "確認刪除" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("紀錄已刪除", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E 已更新刪除")).toHaveCount(0);
  await expect(page.getByRole("button", {
    name: "查看E2E 已更新刪除詳情",
  })).toHaveCount(0);
});

async function createFundPaidExpense(page: Page, name: string) {
  const createButton = page.getByRole("button", { name: "新增紀錄" });

  await createButton.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "基金支出" }).click();
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('input[name="amountTwd"]').fill("1234");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-20");
  await selectCategory(dialog, "日用品");
  await dialog.locator('input[name="note"]').fill("E2E 刪除前備註");
  await dialog.getByRole("button", { name: "新增" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(name)).toBeVisible();
}

async function selectCategory(locator: Locator, name: string) {
  await locator.getByRole("radiogroup", { name: "分類" }).getByText(name, {
    exact: true,
  }).click();
}

async function expectFooterSpacing(dialog: Locator) {
  const bodyBox = await dialog.locator('[data-slot="dialog-body"]').boundingBox();
  const footerBox = await dialog.locator('[data-slot="dialog-footer"]').boundingBox();

  expect(bodyBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  expect(footerBox!.y - (bodyBox!.y + bodyBox!.height)).toBeGreaterThanOrEqual(12);
}
