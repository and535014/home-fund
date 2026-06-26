import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
});

test("renders the dashboard from the E2E database seed", async ({ page }) => {
  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "總覽",
  })).toBeVisible();
  await expect(page.getByRole("link", { name: "總覽" })).toBeVisible();
  await expect(page.getByRole("link", { name: "搜尋" })).toBeVisible();
  await expect(page.getByRole("link", { name: "設定" })).toBeVisible();
  await expect(page.getByRole("link", { name: "週期" })).toHaveCount(0);
  await expect(page.getByText("六月生活費")).toBeVisible();
  await expect(page.getByText("補充用品代墊")).toBeVisible();
  await expect(page.getByText("待退款").first()).toBeVisible();
  await expect(page.getByText("支出分類")).toBeVisible();
  await expect(page.getByText("收支趨勢")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "收支趨勢" })).toBeVisible();
  const recordsRegion = page.getByRole("region", { name: "紀錄" });
  await expect(recordsRegion).toBeVisible();
  await expect(recordsRegion.getByRole("heading", { name: "紀錄" })).toHaveCount(0);
  await expect(recordsRegion.getByRole("tab", { name: "全部收支" })).toBeVisible();
  await expect(recordsRegion.getByRole("tab", { name: "支出紀錄" })).toBeVisible();
  await expect(recordsRegion.getByRole("tab", { name: "收入紀錄" })).toBeVisible();
  await expect(page.locator('[data-slot="card"]')).toHaveCount(3);
  await expect(page.getByRole("link", { name: "紀錄頁" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "紀錄" })).toHaveCount(0);
  await expect(page.getByRole("button", {
    name: "查看補充用品代墊詳情",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看六月生活費詳情",
  })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "日期" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "分類" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "狀態" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "金額" })).toHaveCount(0);
});

test("filters dashboard records by all, expense, and income tabs", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");

  const recordsRegion = page.getByRole("region", { name: "紀錄" });

  await expect(
    recordsRegion.getByRole("tab", { name: "全部收支" }),
  ).toHaveAttribute("data-state", "active");
  await expect(recordsRegion.getByText("六月生活費")).toBeVisible();
  await expect(recordsRegion.getByText("補充用品代墊")).toBeVisible();
  await expect(recordsRegion.getByText("網路費")).toBeVisible();

  await recordsRegion.getByRole("tab", { name: "支出紀錄" }).click();
  await expect(recordsRegion.getByText("補充用品代墊")).toBeVisible();
  await expect(recordsRegion.getByText("網路費")).toBeVisible();
  await expect(recordsRegion.getByText("六月生活費")).toHaveCount(0);

  await recordsRegion.getByRole("tab", { name: "收入紀錄" }).click();
  await expect(recordsRegion.getByText("六月生活費")).toBeVisible();
  await expect(recordsRegion.getByText("補充用品代墊")).toHaveCount(0);
  await expect(recordsRegion.getByText("網路費")).toHaveCount(0);
});

test("opens record details from the dashboard list", async ({ page }) => {
  await page.goto("/?month=2026-06");

  await page.getByRole("button", { name: "查看補充用品代墊詳情" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", {
    name: "補充用品代墊",
  })).toBeVisible();
  await expect(dialog).toContainText("1,880");
  await expect(dialog).not.toContainText("+");
  await expect(dialog).not.toContainText("-$");
  await expect(dialog).toContainText("2026/06/13");
  await expect(dialog).toContainText("日用品");
  await expect(dialog).toContainText("待退款");
  await expect(dialog).toContainText("Kai");
  await expect(dialog).toContainText("補充用品代墊");
  await expect(dialog.getByText("支出紀錄")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "關閉" })).toHaveCount(1);
  await expect(page).toHaveURL(/month=2026-06/u);
});

test("reimburses a refundable expense from the record detail", async ({ page }) => {
  await page.goto("/?month=2026-06");

  await page.getByRole("button", { name: "查看補充用品代墊詳情" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("待退款");
  await dialog.getByRole("button", { exact: true, name: "退款" }).click();

  await expect(dialog.getByRole("heading", { name: "確認退款" })).toBeVisible();
  await expect(dialog).toContainText("補充用品代墊");
  await expect(dialog.getByLabel("付款方式")).toBeVisible();
  await expect(dialog.getByLabel("付款日期")).toBeVisible();
  await expect(dialog.getByLabel("交易備註")).toBeVisible();

  await dialog.getByRole("button", { name: "確認退款" }).click();

  await expect(page.getByText("已完成退款", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", {
    name: "補充用品代墊",
  })).toBeVisible();
  await expect(dialog).toContainText("已退款");
  await expect(dialog).toContainText("這筆代墊支出已退款，無法編輯或刪除。");
  await expect(
    dialog.getByRole("button", { exact: true, name: "退款" }),
  ).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "編輯" })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "刪除" })).toHaveCount(0);

  await page.reload();
  await page.getByRole("button", { name: "查看補充用品代墊詳情" }).click();
  await expect(page.getByRole("dialog")).toContainText("已退款");
});

test("shows no reimbursement status for income details", async ({ page }) => {
  await page.goto("/?month=2026-06");

  await page.getByRole("button", { name: "查看六月生活費詳情" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "六月生活費" })).toBeVisible();
  await expect(dialog).toContainText("80,000");
  await expect(dialog).not.toContainText("+");
  await expect(dialog).toContainText("2026/06/10");
  await expect(dialog).toContainText("生活費");
  await expect(dialog).toContainText("---");
  await expect(dialog).toContainText("Kai");
});

test("shows fund as payer for fund-paid expense details", async ({ page }) => {
  await page.goto("/?month=2026-06");

  await page.getByRole("button", { name: "查看網路費詳情" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "網路費" })).toBeVisible();
  await expect(dialog).toContainText("899");
  await expect(dialog).toContainText("2026/06/05");
  await expect(dialog).toContainText("網路");
  await expect(dialog).toContainText("不需退款");
  await expect(dialog).toContainText("基金");
});

test("opens and closes record details with the keyboard", async ({ page }) => {
  await page.goto("/?month=2026-06");

  const recordButton = page.getByRole("button", {
    name: "查看補充用品代墊詳情",
  });
  await recordButton.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "補充用品代墊",
  })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(recordButton).toBeFocused();
  await expect(page).toHaveURL(/month=2026-06/u);
});

test("shows an empty record list for months without records", async ({ page }) => {
  await page.goto("/?month=2026-07");

  await expect(page.getByText("這個月份尚無紀錄。")).toBeVisible();
  await expect(page.getByRole("button", { name: /查看.*詳情/u })).toHaveCount(0);
});

test("keeps the dashboard desktop arrangement on tablet landscape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1194, height: 834 });
  await page.goto("/?month=2026-06");

  const recordsBox = await page.getByRole("region", { name: "紀錄" }).boundingBox();
  const trendBox = await page
    .getByRole("region", { name: "收支趨勢" })
    .boundingBox();

  expect(recordsBox).not.toBeNull();
  expect(trendBox).not.toBeNull();
  expect(recordsBox!.x).toBeGreaterThan(trendBox!.x);
  expect(recordsBox!.y).toBeLessThan(trendBox!.y + trendBox!.height);
});

test("keeps dashboard visual panels inside the fixed-height page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/?month=2026-06");

  const scrollMetrics = await page.locator("header").evaluate((header) => {
    const scroller = header.nextElementSibling as HTMLElement | null;

    return {
      clientHeight: scroller?.clientHeight ?? 0,
      scrollHeight: scroller?.scrollHeight ?? 0,
    };
  });

  expect(scrollMetrics.scrollHeight).toBeLessThanOrEqual(
    scrollMetrics.clientHeight + 1,
  );

  const trendRegion = page.getByRole("region", { name: "收支趨勢" });
  const trendBox = await trendRegion.boundingBox();
  const trendSvgBox = await trendRegion.locator("svg").boundingBox();

  expect(trendBox).not.toBeNull();
  expect(trendSvgBox).not.toBeNull();
  expect(trendSvgBox!.y).toBeGreaterThanOrEqual(trendBox!.y);
  expect(trendSvgBox!.y + trendSvgBox!.height).toBeLessThanOrEqual(
    trendBox!.y + trendBox!.height + 1,
  );

  const categoryRegion = page.getByRole("region", { name: "支出分類" });
  const reimbursementRegion = page.getByRole("region", { name: "待退款" });
  const recordsRegion = page.getByRole("region", { name: "紀錄" });
  const categoryBox = await categoryRegion.boundingBox();
  const reimbursementBox = await reimbursementRegion.boundingBox();
  const recordsBox = await recordsRegion.boundingBox();

  expect(categoryBox).not.toBeNull();
  expect(reimbursementBox).not.toBeNull();
  expect(recordsBox).not.toBeNull();
  expect(reimbursementBox!.height).toBeCloseTo(categoryBox!.height, 1);
  expect(reimbursementBox!.width).toBeGreaterThan(0);
  expect(categoryBox!.width).toBeGreaterThan(0);
  expect(recordsBox!.width).toBeGreaterThan(0);
  await expectPanelTopLayout(reimbursementRegion, "待退款");
  await expectPanelTopLayout(categoryRegion, "支出分類");
  await expectRecordsPanelTopLayout(recordsRegion);
  await expect(recordsRegion).toHaveCSS("border-left-width", "1px");
  expect((await categoryRegion.getByText("日用品").boundingBox())!.y).toBeLessThan(
    categoryBox!.y + categoryBox!.height / 2,
  );
  await expect(categoryRegion.locator("svg")).toHaveCount(2);
  await expect(categoryRegion.getByText("日用品")).toBeVisible();
  await expect(categoryRegion.getByText("網路")).toBeVisible();
  await expect(categoryRegion.getByText("$8,300")).toBeVisible();
  await expect(categoryRegion.getByText("$899")).toBeVisible();
  await expect(categoryRegion.getByText("90%")).toBeVisible();
  await expect(categoryRegion.getByText("10%")).toBeVisible();
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: "收支趨勢" }),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: "支出分類" }),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: "待退款" }),
  ).toHaveCount(0);
  await expect(page.locator('[data-slot="card"]')).toHaveCount(3);
});

async function expectPanelTopLayout(
  panel: Locator,
  title: string,
) {
  const panelBox = await panel.boundingBox();
  const titleBox = await panel.getByRole("heading", { name: title }).boundingBox();
  const contentBox = await panel.locator(":scope > div").first().boundingBox();

  expect(panelBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(contentBox).not.toBeNull();
  expect(titleBox!.y).toBeLessThan(panelBox!.y + panelBox!.height / 3);
  expect(
    contentBox!.y - (titleBox!.y + titleBox!.height),
  ).toBeGreaterThanOrEqual(12);
  expect(
    contentBox!.y - (titleBox!.y + titleBox!.height),
  ).toBeLessThanOrEqual(16);
}

async function expectRecordsPanelTopLayout(panel: Locator) {
  const panelBox = await panel.boundingBox();
  const tabListBox = await panel.locator('[data-slot="tabs-list"]').boundingBox();
  const itemGroupBox = await panel.locator('[data-slot="item-group"]').boundingBox();

  expect(panelBox).not.toBeNull();
  expect(tabListBox).not.toBeNull();
  expect(itemGroupBox).not.toBeNull();
  expect(tabListBox!.y).toBeLessThan(panelBox!.y + panelBox!.height / 3);
  expect(itemGroupBox!.y).toBeGreaterThanOrEqual(
    tabListBox!.y + tabListBox!.height,
  );
  expect(
    itemGroupBox!.y - (tabListBox!.y + tabListBox!.height),
  ).toBeGreaterThanOrEqual(12);
  expect(
    itemGroupBox!.y - (tabListBox!.y + tabListBox!.height),
  ).toBeLessThanOrEqual(16);
}
