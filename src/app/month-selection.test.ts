import { describe, expect, it } from "vitest";
import {
  addDashboardMonths,
  formatDashboardMonthLabel,
  getCurrentDashboardMonth,
  readDashboardMonth,
} from "./month-selection";

describe("readDashboardMonth", () => {
  it("uses a valid YYYY-MM month query", () => {
    expect(readDashboardMonth("2026-07")).toBe("2026-07");
  });

  it("falls back to the default dashboard month when the query is missing or invalid", () => {
    expect(readDashboardMonth(undefined)).toBe("2026-06");
    expect(readDashboardMonth("2026-13")).toBe("2026-06");
    expect(readDashboardMonth("June 2026")).toBe("2026-06");
  });

  it("uses the first value when Next search params provide an array", () => {
    expect(readDashboardMonth(["2026-08", "2026-09"])).toBe("2026-08");
  });

  it("moves dashboard months across year boundaries", () => {
    expect(addDashboardMonths("2026-01", -1)).toBe("2025-12");
    expect(addDashboardMonths("2026-12", 1)).toBe("2027-01");
  });

  it("formats dashboard month labels in Traditional Chinese", () => {
    expect(formatDashboardMonthLabel("2026-06")).toBe("2026 年 6 月");
  });

  it("reads the current dashboard month from a date", () => {
    expect(getCurrentDashboardMonth(new Date(Date.UTC(2026, 5, 7)))).toBe(
      "2026-06",
    );
  });
});
