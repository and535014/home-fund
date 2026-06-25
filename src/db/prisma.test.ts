import { describe, expect, it } from "vitest";
import { hasCurrentPrismaDelegates, readDatabaseUrl } from "./prisma";

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

describe("hasCurrentPrismaDelegates", () => {
  it("detects stale clients created before ledger import audit models existed", () => {
    expect(hasCurrentPrismaDelegates({
      ledgerImportBatch: {},
      ledgerImportRow: {},
    } as never)).toBe(true);

    expect(hasCurrentPrismaDelegates({
      ledgerRecord: {},
    } as never)).toBe(false);
  });
});
