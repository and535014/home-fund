// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthPickerDialog } from "./month-picker-dialog";

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

afterEach(() => {
  cleanup();
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  vi.restoreAllMocks();
});

describe("MonthPickerDialog", () => {
  it("associates the visible year and month labels with their controls", () => {
    render(<MonthPickerDialog currentMonth="2026-06" />);
    fireEvent.click(screen.getByRole("button", { name: "2026-06" }));

    const year = screen.getByRole("combobox", { name: "年份" });
    const month = screen.getByRole("combobox", { name: "月份" });

    expect(screen.getByLabelText("年份")).toBe(year);
    expect(screen.getByLabelText("月份")).toBe(month);
    expect(year.textContent).toContain("2026 年");
    expect(month.textContent).toContain("6 月");
    expect(year.id).not.toBe(month.id);
  });

  it("keeps distinct, stable control IDs across dialog instances and reopening", async () => {
    render(
      <>
        <MonthPickerDialog currentMonth="2026-06" />
        <MonthPickerDialog currentMonth="2027-07" hrefPath="/refunds" />
      </>,
    );
    const firstTrigger = screen.getByRole("button", { name: "2026-06" });
    const secondTrigger = screen.getByRole("button", { name: "2027-07" });
    fireEvent.click(firstTrigger);
    const firstIds = screen.getAllByRole("combobox").map((control) => control.id);
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    await waitFor(() => expect(document.activeElement).toBe(firstTrigger));

    fireEvent.click(secondTrigger);
    const secondIds = screen.getAllByRole("combobox").map((control) => control.id);
    expect(new Set([...firstIds, ...secondIds]).size).toBe(4);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(secondTrigger));

    fireEvent.click(firstTrigger);
    expect(screen.getAllByRole("combobox").map((control) => control.id)).toEqual(firstIds);
    expect(screen.getByLabelText("年份").textContent).toContain("2026 年");
    expect(screen.getByLabelText("月份").textContent).toContain("6 月");
  });

  it.each([undefined, "/refunds"])("preserves GET submission and the selected month on %s", async (hrefPath) => {
    // Radix scrolls the focused option; jsdom has no scrolling implementation.
    HTMLElement.prototype.scrollIntoView = vi.fn();
    render(<MonthPickerDialog currentMonth="2026-06" hrefPath={hrefPath} />);
    fireEvent.click(screen.getByRole("button", { name: "2026-06" }));

    fireEvent.keyDown(screen.getByLabelText("年份"), { key: "Enter" });
    const yearOptions = within(await screen.findByRole("listbox")).getAllByRole("option");
    expect(yearOptions.map((option) => option.textContent)).toEqual(
      Array.from({ length: 11 }, (_, index) => `${2021 + index} 年`),
    );
    fireEvent.click(screen.getByRole("option", { name: "2027 年" }));
    fireEvent.keyDown(screen.getByLabelText("月份"), { key: "Enter" });
    const monthOptions = within(await screen.findByRole("listbox")).getAllByRole("option");
    expect(monthOptions.map((option) => option.textContent)).toEqual(
      Array.from({ length: 12 }, (_, index) => `${index + 1} 月`),
    );
    fireEvent.click(screen.getByRole("option", { name: "2 月" }));

    const form = screen.getByRole("button", { name: "套用月份" }).closest("form");
    expect(form?.getAttribute("action")).toBe(hrefPath ?? "/");
    expect(form?.getAttribute("method")).toBe("get");
    expect(new FormData(form!).get("month")).toBe("2027-02");
  });
});
