import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

type RuntimeEnvironment = "development" | "production" | "test";

const localDatabaseUrl =
  "postgresql://user:password@localhost:5432/home_fund";

type GlobalWithPrisma = typeof globalThis & {
  homeFundPrisma?: PrismaClient;
};

export function readDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
  nodeEnv: RuntimeEnvironment = process.env.NODE_ENV as RuntimeEnvironment,
): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  if (nodeEnv === "production") {
    throw new Error("DATABASE_URL is required for Prisma runtime");
  }

  return localDatabaseUrl;
}

export function createPrismaClient(
  connectionString = readDatabaseUrl(),
): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export function getPrismaClient(): PrismaClient {
  const globalForPrisma = globalThis as GlobalWithPrisma;

  if (
    globalForPrisma.homeFundPrisma &&
    !hasCurrentPrismaDelegates(globalForPrisma.homeFundPrisma)
  ) {
    void globalForPrisma.homeFundPrisma.$disconnect().catch(() => undefined);
    globalForPrisma.homeFundPrisma = undefined;
  }

  if (!globalForPrisma.homeFundPrisma) {
    globalForPrisma.homeFundPrisma = createPrismaClient();
  }

  return globalForPrisma.homeFundPrisma;
}

export function hasCurrentPrismaDelegates(prisma: PrismaClient): boolean {
  const delegates = prisma as Partial<Record<"ledgerImportBatch" | "ledgerImportRow", unknown>>;

  return Boolean(delegates.ledgerImportBatch && delegates.ledgerImportRow);
}
