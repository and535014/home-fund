import { describe, expect, it, vi } from "vitest";
import { startGoogleSignIn } from "./google-sign-in";

describe("startGoogleSignIn", () => {
  it("starts Better Auth Google social sign-in with request headers", async () => {
    const headers = new Headers({ origin: "http://localhost:3000" });
    const responseHeaders = new Headers({
      location: "https://accounts.google.com/o/oauth2/v2/auth",
      "set-cookie": "better-auth.state=state-value; Path=/; HttpOnly",
    });
    const signInSocial = vi.fn(async () => ({
      headers: responseHeaders,
      response: {
        redirect: true,
        url: "https://accounts.google.com/o/oauth2/v2/auth",
      },
    }));

    const response = await startGoogleSignIn({
      headers,
      auth: {
        api: { signInSocial },
      },
    });

    expect(signInSocial).toHaveBeenCalledWith({
      headers,
      returnHeaders: true,
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
    expect(response.headers.get("set-cookie")).toBe(
      "better-auth.state=state-value; Path=/; HttpOnly",
    );
  });

  it("returns a local error redirect when Better Auth does not provide a URL", async () => {
    await expect(startGoogleSignIn({
      headers: new Headers(),
      auth: {
        api: {
          signInSocial: async () => ({
            headers: new Headers(),
            response: {
              redirect: false,
            },
          }),
        },
      },
    })).resolves.toMatchObject({
      status: 302,
    });
  });

  it("returns a login error redirect when Better Auth cannot start Google sign-in", async () => {
    const response = await startGoogleSignIn({
      headers: new Headers({ origin: "http://localhost:3000" }),
      auth: {
        api: {
          signInSocial: async () => {
            throw new Error("Can't reach database server at 127.0.0.1:5432");
          },
        },
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?auth_error=google_sign_in",
    );
  });
});
