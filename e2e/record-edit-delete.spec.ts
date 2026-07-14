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
  await editDialog.getByText("網路費", { exact: true }).click();
  await editDialog.locator('input[name="note"]').fill("E2E 編輯後備註");
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
  await expect(page.getByText("E2E 已更新刪除")).toHaveCount(0);
  await expect(page.getByRole("button", {
    name: "查看E2E 已更新刪除詳情",
  })).toHaveCount(0);
  const summary = page.getByRole("region", { name: "月報摘要" });
  await expect(summary).toContainText("$201,357");
  await expect(summary).toContainText("$9,199");
  await expect(summary).toContainText("$210,556");
});

test("converts income to a refundable member expense", async ({ page }) => {
  await page.goto("/?month=2026-06");
  await page.getByRole("button", { name: "查看六月房租詳情" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "編輯" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "成員支出" }).click();
  await selectCategory(dialog, "日用品");
  await dialog.getByLabel("支付者").selectOption("member-mei");
  await dialog.getByRole("button", { name: "儲存變更" }).click();

  await expect(page.getByText("紀錄已更新", { exact: true })).toBeVisible();
  const summary = page.getByRole("region", { name: "月報摘要" });
  await expect(summary).toContainText("-$38,643");
  await expect(summary).toContainText("$129,199");
  await expect(summary).toContainText("$90,556");
  await expect(page.getByRole("region", { name: "支出分類" }))
    .toContainText("$128,300");

  await page.getByRole("tab", { name: "收入紀錄" }).click();
  await expect(page.getByText("六月房租", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "支出紀錄" }).click();
  await expect(page.getByText("六月房租", { exact: true })).toBeVisible();

  await page.goto("/refunds?month=2026-06");
  await expect(page.getByRole("region", { name: "未退款支出紀錄" }))
    .toContainText("六月房租");

  await page.goto("/search");
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("六月房租");
  await applyRecordTypeFilter(page, "expense");
  await expect(page.getByRole("button", { name: "查看六月房租詳情" }))
    .toBeVisible();
  await applyRecordTypeFilter(page, "income");
  await expect(page.getByRole("button", { name: "查看六月房租詳情" }))
    .toHaveCount(0);
});

test("converts a refundable member expense to income", async ({ page }) => {
  await page.goto("/?month=2026-06");
  await page.getByRole("button", { name: "查看日用品代墊詳情" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "編輯" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "收入" }).click();
  await selectCategory(dialog, "房租");
  await dialog.getByLabel("支付者").selectOption("member-mei");
  await dialog.getByRole("button", { name: "儲存變更" }).click();

  await expect(page.getByText("紀錄已更新", { exact: true })).toBeVisible();
  const summary = page.getByRole("region", { name: "月報摘要" });
  await expect(summary).toContainText("$214,197");
  await expect(summary).toContainText("$2,779");
  await expect(summary).toContainText("$216,976");
  await expect(page.getByRole("region", { name: "支出分類" }))
    .toContainText("$1,880");

  await page.goto("/refunds?month=2026-06");
  await expect(page.getByRole("region", { name: "未退款支出紀錄" }))
    .not.toContainText("日用品代墊");

  await page.goto("/search");
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("日用品代墊");
  await applyRecordTypeFilter(page, "income");
  await expect(page.getByRole("button", { name: "查看日用品代墊詳情" }))
    .toBeVisible();
  await applyRecordTypeFilter(page, "expense");
  await expect(page.getByRole("button", { name: "查看日用品代墊詳情" }))
    .toHaveCount(0);
});

test("keeps reimbursed expenses outside the edit flow", async ({ page }) => {
  await page.goto("/?month=2026-05");
  await page.getByRole("button", { name: "查看已退款網路費詳情" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "編輯" }))
    .toHaveCount(0);
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

async function applyRecordTypeFilter(
  page: Page,
  type: "expense" | "income",
) {
  await page.getByRole("button", { name: /開啟篩選/u }).click();
  const filterDialog = page.getByRole("dialog");
  await filterDialog.getByLabel("依類型篩選").selectOption(type);
  await filterDialog.getByRole("button", { name: "套用" }).click();
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
