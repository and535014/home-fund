import { defineConfig } from "prisma/config";

const localDatabaseUrl =
  "postgresql://user:password@localhost:5432/home_fund";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
});
