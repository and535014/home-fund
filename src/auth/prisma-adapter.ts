import { prismaAdapter } from "better-auth/adapters/prisma";
import type { AuthDatabaseAdapter } from "./config";

type PrismaAdapterInput = Parameters<typeof prismaAdapter>[0];

export function createAuthDatabaseAdapter(
  prismaClient: PrismaAdapterInput,
): AuthDatabaseAdapter {
  return prismaAdapter(prismaClient, {
    provider: "postgresql",
    transaction: true,
  });
}
