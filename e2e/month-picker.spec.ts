import { expect, test } from "./fixtures";

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone-width", width: 390, height: 844 },
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of ["/", "/refunds"]) {
      test(`selects a custom month and keeps navigation on ${path}`, async ({ page }, testInfo) => {
        await page.setExtraHTTPHeaders({
          "x-e2e-auth-user-id": "user-e2e-linked",
        });
        await page.goto(`${path}?month=2026-06`);
        const trigger = page.getByRole("button", { name: "2026-06", exact: true });
        await trigger.focus();
        await page.keyboard.press("Enter");

        const dialog = page.getByRole("dialog", { name: "自訂月份" });
        const year = dialog.getByRole("combobox", { name: "年份", exact: true });
        const month = dialog.getByRole("combobox", { name: "月份", exact: true });
        await expect(year).toHaveText("2026 年");
        await expect(month).toHaveText("6 月");
        await expect(year).toBeFocused();

        await year.press("Enter");
        await expect(page.getByRole("option")).toHaveCount(11);
        await expect(page.getByRole("option", { name: "2026 年", exact: true })).toBeFocused();
        await page.keyboard.press("ArrowDown");
        await expect(page.getByRole("option", { name: "2027 年", exact: true })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(year).toHaveText("2027 年");
        await expect(year).toBeFocused();

        // Closing and reopening preserves the existing unsent selection.
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(page).toHaveURL(`${path}?month=2026-06`);
        await trigger.click();
        await expect(year).toHaveText("2027 年");
        await page.keyboard.press("Tab");
        await expect(month).toBeFocused();
        await month.press("Enter");
        await expect(page.getByRole("option")).toHaveCount(12);
        await expect(page.getByRole("option", { name: "6 月", exact: true })).toBeFocused();
        await page.keyboard.press("Home");
        await expect(page.getByRole("option", { name: "1 月", exact: true })).toBeFocused();
        await page.keyboard.press("ArrowDown");
        await expect(page.getByRole("option", { name: "2 月", exact: true })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(month).toHaveText("2 月");
        await expect(month).toBeFocused();

        const apply = dialog.getByRole("button", { name: "套用月份" });
        await expect(apply).toBeInViewport();
        await page.screenshot({ path: testInfo.outputPath("month-picker.png") });
        await page.keyboard.press("Tab");
        await expect(apply).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(`${path}?month=2027-02`);
        await expect(dialog).toHaveCount(0);

        await page.getByRole("button", { name: "2027-02", exact: true }).click();
        await expect(year).toHaveText("2027 年");
        await expect(month).toHaveText("2 月");
        await year.click();
        await page.getByRole("option", { name: "2026 年", exact: true }).click();
        await expect(year).toHaveText("2026 年");
        await dialog.getByRole("button", { name: "關閉", exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(page.getByRole("button", { name: "2027-02", exact: true })).toBeFocused();
        await expect(page).toHaveURL(`${path}?month=2027-02`);

        await page.goBack();
        await expect(page).toHaveURL(`${path}?month=2026-06`);
        await expect(dialog).toHaveCount(0);
        await page.goForward();
        await expect(page).toHaveURL(`${path}?month=2027-02`);
        await expect(dialog).toHaveCount(0);
      });
    }
  });
}
