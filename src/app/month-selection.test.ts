import { describe, expect, it } from "vitest";
import { readDashboardMonth } from "./month-selection";

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
});
