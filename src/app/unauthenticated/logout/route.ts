import { createAuth } from "@/auth";

type SignOutAuthApi = {
  api: {
    signOut(context: {
      headers: Headers;
      returnHeaders: true;
    }): Promise<{
      headers: Headers;
    }>;
  };
};

export async function GET(request: Request): Promise<Response> {
  const auth = await createAuth();
  const signOutResult = await (auth as SignOutAuthApi).api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });
  const redirectUrl = new URL("/unauthenticated", request.url);
  const sourceUrl = new URL(request.url);
  const reason = sourceUrl.searchParams.get("reason");
  const authError = sourceUrl.searchParams.get("auth_error");

  if (reason) {
    redirectUrl.searchParams.set("reason", reason);
  }

  if (authError) {
    redirectUrl.searchParams.set("auth_error", authError);
  }

  const headers = new Headers(signOutResult.headers);
  headers.set("location", redirectUrl.toString());

  return new Response(null, {
    headers,
    status: 302,
  });
}
