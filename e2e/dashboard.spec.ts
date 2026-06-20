import { expect, test } from "./fixtures";

test("renders the dashboard from the E2E database seed", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

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
});

test("renders reimbursement as a permission-gated placeholder", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

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
