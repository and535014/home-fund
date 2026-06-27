// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildMonthHref, MonthSwitcher } from "./month-switcher";

describe("MonthSwitcher", () => {
  it("builds root month links by default", () => {
    expect(buildMonthHref("2026-07")).toBe("/?month=2026-07");
  });

  it("builds month links for a route-specific page", () => {
    expect(buildMonthHref("2026-07", "/refunds")).toBe(
      "/refunds?month=2026-07",
    );
  });

  it("keeps previous and next month links on the refund route", () => {
    const html = renderToStaticMarkup(
      <MonthSwitcher currentMonth="2026-06" hrefPath="/refunds" />,
    );

    expect(html).toContain('href="/refunds?month=2026-05"');
    expect(html).toContain('href="/refunds?month=2026-07"');
  });

  it("submits the custom month picker to the same refund route", () => {
    render(<MonthSwitcher currentMonth="2026-06" hrefPath="/refunds" />);

    fireEvent.click(screen.getByRole("button", { name: "2026-06" }));

    const form = document.querySelector("form");

    expect(form?.getAttribute("action")).toBe("/refunds");
    expect(screen.queryByText(/月報/)).toBeNull();
  });
});
