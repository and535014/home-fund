import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
});

test("opens refunds from dashboard and keeps refund out of the mobile tab bar", async ({
  page,
}) => {
  await page.goto("/?month=2026-06");

  await expect(page.locator('a[data-sidebar="menu-button"][href="/search"]'))
    .toBeVisible();
  await expect(page.locator('a[data-sidebar="menu-button"][href="/refunds"]'))
    .toBeVisible();

  const pendingRegion = page.getByRole("region", { name: "待退款" });
  await expect(pendingRegion.getByRole("link", { name: /前往退款/u }))
    .toHaveAttribute("href", "/refunds?month=2026-06");

  await pendingRegion.getByRole("link", { name: /前往退款/u }).click();

  await expect(page).toHaveURL(/\/refunds\?month=2026-06/u);
  await expect(page.getByRole("heading", {
    exact: true,
    level: 2,
    name: "退款",
  })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/refunds?month=2026-06");

  await expect(page.getByRole("heading", {
    exact: true,
    level: 2,
    name: "退款",
  })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主要導覽" }).getByRole("link", {
    name: "退款",
  })).toHaveCount(0);
});

test("filters refund page by member and reuses shared detail dialogs", async ({
  page,
}) => {
  await page.goto("/refunds?month=2026-06");

  await expect(page.getByText("未退款 2 筆")).toBeVisible();
  await expect(page.getByText("$8,300").first()).toBeVisible();
  await expect(page.getByText("已退款 2 筆")).toBeVisible();
  await expect(page.getByText("$1,600").first()).toBeVisible();

  await page.getByRole("tab", { name: "Mei" }).click();

  await expect(page.getByText("未退款 1 筆")).toBeVisible();
  await expect(page.getByText("已退款 1 筆")).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看日用品代墊詳情",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看補充用品代墊詳情",
  })).toHaveCount(0);
  await expect(page.getByRole("button", {
    name: "查看付給 Mei 退款紀錄詳情",
  })).toBeVisible();

  await page.getByRole("button", { name: "查看日用品代墊詳情" }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "日用品代墊" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "編輯" })).toBeVisible();
  await expect(dialog.getByRole("button", { exact: true, name: "退款" }))
    .toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", {
    name: "查看付給 Mei 退款紀錄詳情",
  }).click();
  dialog = page.getByRole("dialog", { name: "退款紀錄" });
  await expect(dialog.getByRole("heading", { name: "退款紀錄" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "編輯" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "查看關聯紀錄" }))
    .toBeVisible();
});

test("shows selection summary and shared batch refund validation", async ({
  page,
}) => {
  await page.goto("/refunds?month=2026-06");

  const unpaidRegion = page.getByRole("region", { name: "未退款支出紀錄" });

  await unpaidRegion.getByRole("button", { name: "選取" }).click();
  await expect(page.getByText("已選取 0 筆")).toBeVisible();
  await expect(unpaidRegion.getByRole("button", { name: "批次退款" }))
    .toBeDisabled();

  await unpaidRegion.getByRole("button", { name: "選取日用品代墊" }).click();
  await expect(page.getByText("已選取 1 筆")).toBeVisible();
  await expect(unpaidRegion.getByRole("button", { name: "批次退款" }))
    .toBeEnabled();

  await unpaidRegion.getByRole("button", { name: "選取補充用品代墊" }).click();
  await expect(page.getByText("已選取 2 筆")).toBeVisible();

  await unpaidRegion.getByRole("button", { name: "批次退款" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "確認批次退款" })).toBeVisible();
  await expect(dialog).toContainText("退款總金額");
  await expect(dialog).toContainText("$8,300");
  await expect(dialog).toContainText(
    "批次退款一次只能選擇同一位代墊成員的紀錄。",
  );
  await expect(dialog.getByRole("button", { name: "確認退款" })).toBeDisabled();
});
