import { describe, expect, it } from "vitest";
import {
  buildAuthConfig,
  readAuthEnvironment,
  type AuthEnvironment,
} from "./config";

describe("readAuthEnvironment", () => {
  it("uses safe local placeholders when Google OAuth env is missing outside production", () => {
    expect(readAuthEnvironment({}, "development")).toEqual({
      baseUrl: "http://localhost:3000",
      googleClientId: "local-google-client-id",
      googleClientSecret: "local-google-client-secret",
      secret: "local-development-better-auth-secret",
      usesPlaceholderGoogleCredentials: true,
    });
  });

  it("requires Google OAuth credentials and an auth secret in production", () => {
    expect(() => readAuthEnvironment({}, "production")).toThrow(
      "Missing Better Auth environment variables",
    );
  });
});

describe("buildAuthConfig", () => {
  it("builds a Google provider config for Better Auth", () => {
    const env: AuthEnvironment = {
      baseUrl: "https://example.com",
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      secret: "better-auth-secret",
      usesPlaceholderGoogleCredentials: false,
    };

    expect(buildAuthConfig(env)).toMatchObject({
      baseURL: "https://example.com",
      secret: "better-auth-secret",
      socialProviders: {
        google: {
          clientId: "google-client-id",
          clientSecret: "google-client-secret",
        },
      },
    });
  });

  it("accepts an injected database adapter for persistent sessions", () => {
    const env: AuthEnvironment = {
      baseUrl: "https://example.com",
      googleClientId: "google-client-id",
      googleClientSecret: "google-client-secret",
      secret: "better-auth-secret",
      usesPlaceholderGoogleCredentials: false,
    };
    const database = () => {
      throw new Error("not called in config test");
    };

    expect(buildAuthConfig(env, database).database).toBe(database);
  });
});
