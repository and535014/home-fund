import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("general member cannot access confirmation control for another member reminder", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });

  await page.goto("/recurring?month=2026-06");

  const pendingRegion = page.locator('section[aria-labelledby="pending-title"]');
  await expect(pendingRegion).toHaveAttribute("data-recurring-ready", "true");
  await expect(pendingRegion.getByText("Kai 每月生活費提醒")).toBeVisible();
  await expect(pendingRegion.getByText("尚未計入本月總額")).toBeVisible();
  await expect(
    pendingRegion.getByRole("button", { name: /確認 Kai 每月生活費提醒 入帳/u }),
  ).toHaveCount(0);
});

test("finance manager confirms a pending recurring reminder", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/recurring?month=2026-06");

  const pendingRegion = page.locator('section[aria-labelledby="pending-title"]');
  await expect(pendingRegion).toHaveAttribute("data-recurring-ready", "true");
  await expect(pendingRegion.getByText("Kai 每月生活費提醒")).toBeVisible();
  await expect(pendingRegion.getByText("$80,000")).toBeVisible();

  await pendingRegion
    .getByRole("button", { name: /確認 Kai 每月生活費提醒 入帳/u })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "確認週期提醒" })).toBeVisible();
  await expect(dialog).toContainText("Kai 每月生活費提醒");
  await dialog.getByRole("button", { name: "確認建立紀錄" }).click();

  await expect(pendingRegion.getByText("沒有待確認週期項目")).toBeVisible();
  await expect(pendingRegion.getByText("已確認週期提醒。")).toBeVisible();
  await expect(page).not.toHaveURL(/recurring=/u);
  await page.goto("/records?month=2026-06");
  await expect(page.getByText("Kai 每月生活費提醒")).toBeVisible();
});
