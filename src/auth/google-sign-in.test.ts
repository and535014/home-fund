import { describe, expect, it, vi } from "vitest";
import { startGoogleSignIn } from "./google-sign-in";

describe("startGoogleSignIn", () => {
  it("starts Better Auth Google social sign-in with request headers", async () => {
    const headers = new Headers({ origin: "http://localhost:3000" });
    const signInSocial = vi.fn(async () => ({
      redirect: true,
      url: "https://accounts.google.com/o/oauth2/v2/auth",
    }));

    const response = await startGoogleSignIn({
      headers,
      auth: {
        api: { signInSocial },
      },
    });

    expect(signInSocial).toHaveBeenCalledWith({
      headers,
      body: {
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/",
      },
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
  });

  it("returns a local error redirect when Better Auth does not provide a URL", async () => {
    await expect(startGoogleSignIn({
      headers: new Headers(),
      auth: {
        api: {
          signInSocial: async () => ({
            redirect: false,
          }),
        },
      },
    })).resolves.toMatchObject({
      status: 302,
    });
  });
});
