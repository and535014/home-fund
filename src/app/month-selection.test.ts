import { describe, expect, it } from "vitest";
import {
  addMonths,
  formatMonthLabel,
  getCurrentMonth,
  readMonthParam,
} from "./month-selection";

describe("readMonthParam", () => {
  it("uses a valid YYYY-MM month query", () => {
    expect(readMonthParam("2026-07")).toBe("2026-07");
  });

  it("falls back to the default month when the query is missing or invalid", () => {
    expect(readMonthParam(undefined)).toBe("2026-06");
    expect(readMonthParam("2026-13")).toBe("2026-06");
    expect(readMonthParam("June 2026")).toBe("2026-06");
  });

  it("uses the first value when Next search params provide an array", () => {
    expect(readMonthParam(["2026-08", "2026-09"])).toBe("2026-08");
  });

  it("moves months across year boundaries", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });

  it("formats month labels in Traditional Chinese", () => {
    expect(formatMonthLabel("2026-06")).toBe("2026 年 6 月");
  });

  it("reads the current month from a date", () => {
    expect(getCurrentMonth(new Date(Date.UTC(2026, 5, 7)))).toBe(
      "2026-06",
    );
  });
});
