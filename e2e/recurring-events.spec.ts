import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
});

test("creates a recurring event from the existing add-record dialog", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await openCreateDialog(page, "收入");

  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="name"]').fill("E2E 新增週期收入");
  await dialog.locator('input[name="amountTwd"]').fill("1234");
  await selectCategory(dialog, "生活費");

  await dialog.getByLabel("重複").selectOption("fixed_day");
  await expect(dialog.getByLabel("指定日期")).toBeVisible();
  await expect(dialog.locator('input[name="occurredOn"]')).toHaveCount(0);
  await dialog.getByLabel("指定日期").selectOption("28");
  await expect(dialog.getByLabel("入帳模式")).toHaveValue("immediate");
  await dialog.getByLabel("入帳模式").selectOption("reminder");

  await dialog.getByRole("button", { name: "新增" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("週期事件已新增")).toBeVisible();

  await page.goto("/settings/recurring");
  await expect(page.getByRole("region", { name: "收入週期事件" }))
    .toContainText("E2E 新增週期收入");
  await expect(page.getByRole("region", { name: "收入週期事件" }))
    .toContainText("每月 28 號 · 提醒入帳");
});

test("creates current-month occurrences only for due or future new events", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");
  await createRecurringIncomeEvent(page, {
    name: "E2E 月底補當月",
    recurrenceSchedule: "month_end",
  });

  await page.goto("/?month=2026-06");
  const recordsRegion = page.getByRole("region", { name: "紀錄" });
  await expect(recordsRegion).toContainText("E2E 月底補當月");
  await expect(recordsRegion).toContainText("未入帳");
  await expect(recordsRegion).toContainText("週期事件");

  await createRecurringIncomeEvent(page, {
    name: "E2E 已過不回補",
    recurrenceDay: "1",
    recurrenceSchedule: "fixed_day",
  });

  await page.goto("/?month=2026-06");
  await expect(page.getByRole("region", { name: "紀錄" }))
    .not.toContainText("E2E 已過不回補");

  await page.goto("/settings/recurring");
  await expect(page.getByRole("region", { name: "收入週期事件" }))
    .toContainText("E2E 已過不回補");
});

test("deletes a recurring event from settings after confirmation", async ({
  page,
}) => {
  await page.goto("/settings/recurring");

  const incomeRegion = page.getByRole("region", { name: "收入週期事件" });
  await expect(incomeRegion).toContainText("E2E Kai 週期生活費");

  await incomeRegion.getByRole("button", {
    name: "刪除 E2E Kai 週期生活費",
  }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "刪除週期事件" })).toBeVisible();
  await expect(dialog).toContainText("E2E Kai 週期生活費");
  await expect(dialog).toContainText("每月 10 號");
  await expect(dialog).toContainText("提醒入帳");

  await dialog.getByRole("button", { name: "確認刪除" }).click();

  await expect(page.getByText("週期事件已刪除")).toBeVisible();
  await expect(incomeRegion).not.toContainText("E2E Kai 週期生活費");
});

test("shows and confirms a pending recurring occurrence from Home", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");

  const recordsRegion = page.getByRole("region", { name: "紀錄" });
  await expect(recordsRegion).toContainText("E2E Kai 週期生活費");
  await expect(recordsRegion).toContainText("Kai · 週期事件");
  await expect(recordsRegion).toContainText("未入帳");

  await page.getByRole("button", {
    name: "查看E2E Kai 週期生活費詳情",
  }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", {
    name: "E2E Kai 週期生活費",
  })).toBeVisible();
  await expect(dialog).toContainText("週期事件：「每月 10 號，提醒入帳」");
  await expect(dialog).toContainText("待入帳");
  await expect(dialog.getByRole("button", { name: "確認入帳" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "編輯" })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "刪除" })).toHaveCount(0);

  await dialog.getByRole("button", { name: "確認入帳" }).click();

  await expect(page.getByText("週期事件已入帳。")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.reload();
  const refreshedRecordsRegion = page.getByRole("region", { name: "紀錄" });
  await expect(refreshedRecordsRegion).toContainText("E2E Kai 週期生活費");
  await expect(refreshedRecordsRegion).not.toContainText("未入帳");

  await page.getByRole("button", {
    name: "查看E2E Kai 週期生活費詳情",
  }).click();
  const postedDialog = page.getByRole("dialog");
  await expect(postedDialog).toContainText("週期事件：「每月 10 號，提醒入帳」");
  await expect(postedDialog).toContainText("2026/06/10");
  await expect(postedDialog.getByRole("button", { name: "確認入帳" })).toHaveCount(0);
});

test("includes pending recurring occurrences in Search detail flow", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("E2E Kai");

  await expect(page.getByText("E2E Kai 週期生活費")).toBeVisible();
  await expect(page.getByText("Kai · 週期事件")).toBeVisible();
  await expect(page.getByText("未入帳")).toBeVisible();

  await page.getByRole("button", {
    name: "查看E2E Kai 週期生活費詳情",
  }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", {
    name: "E2E Kai 週期生活費",
  })).toBeVisible();
  await expect(dialog).toContainText("週期事件：「每月 10 號，提醒入帳」");
  await expect(dialog.getByRole("button", { name: "確認入帳" })).toBeVisible();
});

async function openCreateDialog(page: Page, tabName: string) {
  const createButton = page.getByRole("button", { name: "新增紀錄" });

  await createButton.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").getByRole("tab", { name: tabName }).click();
}

async function selectCategory(locator: Locator, name: string) {
  await locator.getByRole("radiogroup", { name: "分類" }).getByText(name, {
    exact: true,
  }).click();
}

async function createRecurringIncomeEvent(
  page: Page,
  {
    name,
    recurrenceDay,
    recurrenceSchedule,
  }: {
    name: string;
    recurrenceDay?: string;
    recurrenceSchedule: "fixed_day" | "month_end";
  },
) {
  await openCreateDialog(page, "收入");

  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('input[name="amountTwd"]').fill("1234");
  await selectCategory(dialog, "生活費");
  await dialog.getByLabel("重複").selectOption(recurrenceSchedule);

  if (recurrenceDay) {
    await dialog.getByLabel("指定日期").selectOption(recurrenceDay);
  }

  await dialog.getByLabel("入帳模式").selectOption("reminder");
  await dialog.getByRole("button", { name: "新增" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("週期事件已新增")).toBeVisible();
}
