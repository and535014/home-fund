import { describe, expect, it } from "vitest";
import { createAuthDatabaseAdapter } from "./prisma-adapter";

describe("createAuthDatabaseAdapter", () => {
  it("creates a Better Auth database adapter for PostgreSQL Prisma clients", () => {
    const prismaClient = {};
    const adapter = createAuthDatabaseAdapter(prismaClient);

    expect(typeof adapter).toBe("function");
  });
});
