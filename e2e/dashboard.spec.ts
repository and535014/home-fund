import { expect, test } from "./fixtures";

test("renders the dashboard from the E2E database seed", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "總覽",
  })).toBeVisible();
  await expect(page.getByText("六月生活費")).toBeVisible();
  await expect(page.getByText("補充用品代墊")).toBeVisible();
  await expect(page.getByText("2 筆待處理")).toBeVisible();
  await expect(page.getByText("1 筆待確認")).toBeVisible();
  await expect(page.getByRole("link", { name: "紀錄頁" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "紀錄" })).toHaveCount(0);
});

test("keeps fund-paid expenses out of reimbursement rows", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/reimbursements?month=2026-06");

  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );

  await expect(reimbursementRegion.getByText("Mei", { exact: true })).toBeVisible();
  await expect(reimbursementRegion.getByText("Kai", { exact: true })).toBeVisible();
  await expect(reimbursementRegion.getByText("Lin")).toHaveCount(0);
});
