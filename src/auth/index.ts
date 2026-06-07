import { betterAuth } from "better-auth/minimal";
import {
  buildAuthConfig,
  readAuthEnvironment,
  type AuthDatabaseAdapter,
} from "./config";

export function createAuthWithDatabase(database: AuthDatabaseAdapter) {
  return betterAuth(buildAuthConfig(readAuthEnvironment(), database));
}

export async function createAuth() {
  const [{ getPrismaClient }, { createAuthDatabaseAdapter }] =
    await Promise.all([
      import("@/db/prisma"),
      import("./prisma-adapter"),
    ]);

  return createAuthWithDatabase(
    createAuthDatabaseAdapter(getPrismaClient()),
  );
}
