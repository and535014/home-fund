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
  await expect(page.getByRole("link", { name: "退款" })).toBeVisible();
  await expect(page.getByRole("link", { name: "設定" })).toBeVisible();
  await expect(page.getByRole("link", { name: "週期" })).toHaveCount(0);
  await expect(page.getByText("六月生活費")).toBeVisible();
  await expect(page.getByText("補充用品代墊")).toBeVisible();
  await expect(page.getByText("待退款").first()).toBeVisible();
  await expect(page.getByText("支出分類")).toBeVisible();
  await expect(page.getByText("收支趨勢")).toBeVisible();
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
  const trendBox = await page.getByText("收支趨勢").boundingBox();

  expect(recordsBox).not.toBeNull();
  expect(trendBox).not.toBeNull();
  expect(recordsBox!.x).toBeGreaterThan(trendBox!.x);
  expect(recordsBox!.y).toBeLessThan(trendBox!.y + trendBox!.height);
});

test("renders reimbursement as a permission-gated placeholder", async ({ page }) => {
  await page.goto("/reimbursements?month=2026-06");

  await expect(page.getByRole("heading", { name: "退款" })).toBeVisible();
  await expect(page.getByText("敬請期待")).toBeVisible();
});

test("blocks general members from reimbursement", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });

  await page.goto("/reimbursements?month=2026-06");

  await expect(page).toHaveURL(/\/$/u);
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
});
