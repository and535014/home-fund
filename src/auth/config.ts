import type { BetterAuthOptions } from "better-auth/minimal";

export type AuthEnvironment = {
  baseUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  secret: string;
  usesPlaceholderGoogleCredentials: boolean;
};

type RuntimeEnvironment = "development" | "production" | "test";

const localDefaults = {
  baseUrl: "http://localhost:3000",
  googleClientId: "local-google-client-id",
  googleClientSecret: "local-google-client-secret",
  secret: "local-development-better-auth-secret",
};

export function readAuthEnvironment(
  env: Record<string, string | undefined> = process.env,
  nodeEnv: RuntimeEnvironment = process.env.NODE_ENV as RuntimeEnvironment,
): AuthEnvironment {
  const missing = [
    ["BETTER_AUTH_URL", env.BETTER_AUTH_URL],
    ["BETTER_AUTH_SECRET", env.BETTER_AUTH_SECRET],
    ["GOOGLE_CLIENT_ID", env.GOOGLE_CLIENT_ID],
    ["GOOGLE_CLIENT_SECRET", env.GOOGLE_CLIENT_SECRET],
  ].filter(([, value]) => !value);

  if (nodeEnv === "production" && missing.length > 0) {
    throw new Error(
      `Missing Better Auth environment variables: ${missing
        .map(([key]) => key)
        .join(", ")}`,
    );
  }

  const googleClientId = env.GOOGLE_CLIENT_ID ?? localDefaults.googleClientId;
  const googleClientSecret =
    env.GOOGLE_CLIENT_SECRET ?? localDefaults.googleClientSecret;

  return {
    baseUrl: env.BETTER_AUTH_URL ?? localDefaults.baseUrl,
    googleClientId,
    googleClientSecret,
    secret: env.BETTER_AUTH_SECRET ?? localDefaults.secret,
    usesPlaceholderGoogleCredentials:
      googleClientId === localDefaults.googleClientId ||
      googleClientSecret === localDefaults.googleClientSecret,
  };
}

export function buildAuthConfig(env: AuthEnvironment): BetterAuthOptions {
  return {
    baseURL: env.baseUrl,
    secret: env.secret,
    socialProviders: {
      google: {
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
      },
    },
  };
}
