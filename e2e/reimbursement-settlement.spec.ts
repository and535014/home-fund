import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("finance manager cannot submit an empty reimbursement selection", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/reimbursements?month=2026-06");

  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );
  await expect(reimbursementRegion).toHaveAttribute(
    "data-settlement-ready",
    "true",
  );
  await expect(
    reimbursementRegion.getByRole("button", { name: "執行退款" }),
  ).toBeDisabled();
});

test("general member cannot access reimbursement settlement controls", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });

  await page.goto("/reimbursements?month=2026-06");

  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );
  await expect(reimbursementRegion).toHaveAttribute(
    "data-settlement-ready",
    "true",
  );
  await expect(reimbursementRegion.getByText("2 筆待處理")).toBeVisible();
  await expect(reimbursementRegion.getByRole("checkbox")).toHaveCount(0);
  await expect(
    reimbursementRegion.getByRole("button", { name: "執行退款" }),
  ).toHaveCount(0);
});

test("finance manager reimburses a selected member-paid expense", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/reimbursements?month=2026-06");

  const reimbursementRegion = page.locator(
    'section[aria-labelledby="reimbursement-title"]',
  );
  await expect(reimbursementRegion).toHaveAttribute(
    "data-settlement-ready",
    "true",
  );
  await expect(reimbursementRegion.getByText("2 筆待處理")).toBeVisible();
  await expect(reimbursementRegion.getByText("$8,300")).toBeVisible();
  await reimbursementRegion
    .getByRole("checkbox", { name: /Mei 2026-06-09 \$6,420/ })
    .check();

  await expect(reimbursementRegion.getByText("已選取 1 筆")).toBeVisible();
  await expect(
    reimbursementRegion.getByText("已選取 1 筆").locator(".."),
  ).toContainText("$6,420");

  await reimbursementRegion.getByRole("button", { name: "執行退款" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "確認退款" })).toBeVisible();
  await expect(dialog).toContainText("$6,420");
  await dialog.getByRole("button", { name: "確認退款" }).click();

  await expect(reimbursementRegion.getByText("1 筆待處理")).toBeVisible();
  await expect(reimbursementRegion.getByText("Mei")).toHaveCount(0);
  await expect(reimbursementRegion.getByText("$6,420")).toHaveCount(0);
  await expect(
    reimbursementRegion.getByText("Kai", { exact: true }),
  ).toBeVisible();
  await expect(reimbursementRegion.getByText("$1,880").first()).toBeVisible();
  await expect(page).toHaveURL(/reimbursement=success/u);
});
