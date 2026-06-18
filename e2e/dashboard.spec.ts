import { expect, test } from "./fixtures";

test("renders the dashboard from the E2E database seed", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toBeVisible();
  await expect(page.getByText("六月生活費")).toBeVisible();
  await expect(page.getByText("補充用品代墊")).toBeVisible();
  await expect(page.getByText("2 筆待處理")).toBeVisible();
  await expect(page.getByText("Kai 每月生活費提醒")).toBeVisible();
  await expect(page.getByText("尚未計入本月總額")).toBeVisible();
});

test("keeps fund-paid expenses out of reimbursement rows", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/?month=2026-06");

  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );

  await expect(reimbursementRegion.getByText("Mei", { exact: true })).toBeVisible();
  await expect(reimbursementRegion.getByText("Kai", { exact: true })).toBeVisible();
  await expect(reimbursementRegion.getByText("Lin")).toHaveCount(0);
});
