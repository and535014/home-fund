import { describe, expect, it } from "vitest";
import { readDatabaseUrl } from "./prisma";

describe("readDatabaseUrl", () => {
  it("uses a local placeholder database URL outside production", () => {
    expect(readDatabaseUrl({}, "development")).toBe(
      "postgresql://user:password@localhost:5432/home_fund",
    );
  });

  it("requires DATABASE_URL in production", () => {
    expect(() => readDatabaseUrl({}, "production")).toThrow(
      "DATABASE_URL is required",
    );
  });
});
