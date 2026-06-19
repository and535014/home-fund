import { describe, expect, it } from "vitest";
import { resolveGoogleIdentityFromAuthSession } from "./session-identity";

describe("resolveGoogleIdentityFromAuthSession", () => {
  it("returns null when there is no authenticated Better Auth user", () => {
    expect(resolveGoogleIdentityFromAuthSession({
      user: null,
      accounts: [
        {
          providerId: "google",
          accountId: "google-mei",
          userId: "user-mei",
        },
      ],
    })).toBeNull();
  });

  it("maps the linked Google account id to the app Google identity subject", () => {
    expect(resolveGoogleIdentityFromAuthSession({
      user: {
        id: "user-mei",
        email: " MEI@EXAMPLE.COM ",
        name: " Mei Lin ",
        image: " https://example.com/mei.png ",
      },
      accounts: [
        {
          providerId: "github",
          accountId: "github-mei",
          userId: "user-mei",
        },
        {
          providerId: "google",
          accountId: "google-mei",
          userId: "user-mei",
        },
      ],
    })).toEqual({
      subject: "google-mei",
      email: "mei@example.com",
      displayName: "Mei Lin",
      avatarUrl: "https://example.com/mei.png",
    });
  });

  it("returns null when the authenticated user has no linked Google account", () => {
    expect(resolveGoogleIdentityFromAuthSession({
      user: {
        id: "user-mei",
        email: "mei@example.com",
      },
      accounts: [
        {
          providerId: "google",
          accountId: "google-kai",
          userId: "user-kai",
        },
      ],
    })).toBeNull();
  });

  it("omits blank Google email values", () => {
    expect(resolveGoogleIdentityFromAuthSession({
      user: {
        id: "user-mei",
        email: " ",
      },
      accounts: [
        {
          providerId: "google",
          accountId: "google-mei",
          userId: "user-mei",
        },
      ],
    })).toEqual({
      subject: "google-mei",
    });
  });
});
