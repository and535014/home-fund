import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "prisma/config";

const inheritedEnvKeys = new Set(Object.keys(process.env));
const localDatabaseUrl =
  "postgresql://postgres:postgres@127.0.0.1:5432/home_fund";

loadEnvFile(".env");
loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      localDatabaseUrl,
  },
});

function loadEnvFile(path: string) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/u);

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/u);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (!key || inheritedEnvKeys.has(key)) {
      continue;
    }

    process.env[key] = parseEnvValue(rawValue ?? "");
  }
}

function parseEnvValue(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}
