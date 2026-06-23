type GoogleSignInResult =
  | {
      redirect: boolean;
      url: string;
    }
  | {
      redirect: boolean;
      url?: undefined;
    };

type GoogleSignInResponse = {
  headers: Headers;
  response: GoogleSignInResult;
};

export type GoogleSignInAuthApi = {
  api: {
    signInSocial(context: {
      headers: Headers;
      returnHeaders: true;
      body: {
        provider: "google";
        callbackURL: string;
        errorCallbackURL: string;
      };
    }): Promise<GoogleSignInResponse>;
  };
};

export type StartGoogleSignInInput = {
  headers: Headers;
  auth: GoogleSignInAuthApi;
  bindToken?: string;
  inviteToken?: string;
};

export async function startGoogleSignIn(
  input: StartGoogleSignInInput,
): Promise<Response> {
  const result = await startBetterAuthGoogleSignIn(input);
  const redirectUrl = result.headers.get("location") ?? result.response.url;

  if (redirectUrl) {
    return redirectWithHeaders(redirectUrl, result.headers);
  }

  return Response.redirect(new URL("/login?auth_error=google_sign_in", originFrom(
    input.headers,
  )));
}

async function startBetterAuthGoogleSignIn(
  input: StartGoogleSignInInput,
): Promise<GoogleSignInResponse> {
  try {
    return await input.auth.api.signInSocial({
      headers: input.headers,
      returnHeaders: true,
      body: {
        provider: "google",
        callbackURL: googleCallbackUrl(input),
        errorCallbackURL: googleErrorCallbackUrl(input),
      },
    });
  } catch {
    return {
      headers: new Headers({
        location: new URL("/login?auth_error=google_sign_in", originFrom(
          input.headers,
        )).toString(),
      }),
      response: {
        redirect: true,
        url: new URL("/login?auth_error=google_sign_in", originFrom(
          input.headers,
        )).toString(),
      },
    };
  }
}

function googleCallbackUrl(input: StartGoogleSignInInput): string {
  if (input.bindToken) {
    return `/members/bind/callback?token=${encodeURIComponent(input.bindToken)}`;
  }

  if (input.inviteToken) {
    return `/invite/accept/callback?token=${encodeURIComponent(input.inviteToken)}`;
  }

  return "/";
}

function googleErrorCallbackUrl(input: StartGoogleSignInInput): string {
  if (input.bindToken) {
    return `/members/bind?token=${encodeURIComponent(input.bindToken)}&auth_error=google_sign_in`;
  }

  if (input.inviteToken) {
    return `/invite/accept?token=${encodeURIComponent(input.inviteToken)}&auth_error=google_sign_in`;
  }

  return "/";
}

function originFrom(headers: Headers): string {
  return headers.get("origin") ?? "http://localhost:3000";
}

function redirectWithHeaders(url: string, headers: Headers): Response {
  const responseHeaders = new Headers();

  headers.forEach((value, key) => {
    if (key.toLowerCase() !== "location") {
      responseHeaders.append(key, value);
    }
  });

  responseHeaders.set("location", url);

  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
}
