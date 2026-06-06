import { betterAuth } from "better-auth/minimal";
import { buildAuthConfig, readAuthEnvironment } from "./config";

export function createAuth() {
  return betterAuth(buildAuthConfig(readAuthEnvironment()));
}
