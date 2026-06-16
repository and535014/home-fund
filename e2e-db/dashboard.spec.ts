import { expect, test } from "@playwright/test";

test("renders the dashboard from the E2E database seed", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-current-member-email": "e2e-finance@example.com",
  });

  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toBeVisible();
  await expect(page.getByText("六月生活費")).toBeVisible();
  await expect(page.getByText("補充用品代墊")).toBeVisible();
  await expect(page.getByText("2 筆待處理")).toBeVisible();
  await expect(page.getByText("2026-06 尚未確認入帳")).toBeVisible();
});

test("keeps fund-paid expenses out of reimbursement rows", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-current-member-email": "e2e-finance@example.com",
  });

  await page.goto("/?month=2026-06");

  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );

  await expect(reimbursementRegion.getByText("Mei")).toBeVisible();
  await expect(reimbursementRegion.getByText("Kai")).toBeVisible();
  await expect(reimbursementRegion.getByText("Lin")).toHaveCount(0);
});
