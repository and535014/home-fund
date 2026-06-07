type GoogleSignInResult =
  | {
      redirect: boolean;
      url: string;
    }
  | {
      redirect: boolean;
      url?: undefined;
    };

export type GoogleSignInAuthApi = {
  api: {
    signInSocial(context: {
      headers: Headers;
      body: {
        provider: "google";
        callbackURL: string;
        errorCallbackURL: string;
      };
    }): Promise<GoogleSignInResult>;
  };
};

export type StartGoogleSignInInput = {
  headers: Headers;
  auth: GoogleSignInAuthApi;
};

export async function startGoogleSignIn(
  input: StartGoogleSignInInput,
): Promise<Response> {
  const result = await input.auth.api.signInSocial({
    headers: input.headers,
    body: {
      provider: "google",
      callbackURL: "/",
      errorCallbackURL: "/",
    },
  });

  if (result.url) {
    return Response.redirect(result.url);
  }

  return Response.redirect(new URL("/?auth_error=google_sign_in", originFrom(
    input.headers,
  )));
}

function originFrom(headers: Headers): string {
  return headers.get("origin") ?? "http://localhost:3000";
}
