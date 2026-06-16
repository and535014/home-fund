import { expect, test } from "@playwright/test";

test("blocks household data before Google sign-in", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", {
    name: "請先使用 Google 登入",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "使用 Google 登入",
  })).toBeVisible();
  await expect(page.getByText("確認收入")).toHaveCount(0);
});

test("shows auth callback errors on the blocked homepage", async ({ page }) => {
  await page.goto("/?error=state_mismatch");

  await expect(page.getByRole("alert")).toContainText(
    "登入驗證狀態已失效",
  );
});

test("renders the dashboard for an E2E linked household member", async ({
  page,
}) => {
  await signInAsE2eMember(page);
  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toBeVisible();
  await expect(page.getByText("確認收入")).toBeVisible();
  await expect(page.getByText("六月房租")).toBeVisible();
  await expect(page.getByText("日用品代墊")).toBeVisible();
  await expect(page.getByRole("heading", { name: "退款表" })).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "待確認週期項目",
  })).toBeVisible();
});

test("keeps the core dashboard reachable without horizontal overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAsE2eMember(page);
  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toBeVisible();
  await expect(page.getByRole("link", { name: "收入" })).toBeVisible();
  await expect(page.getByRole("link", { name: "支出" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
});

async function signInAsE2eMember(page: {
  setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>;
}) {
  await page.setExtraHTTPHeaders({
    "x-e2e-dashboard-fixture": "1",
    "x-e2e-current-member-email": "e2e-finance@example.com",
  });
}
