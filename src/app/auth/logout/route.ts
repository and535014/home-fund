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

export async function POST(request: Request): Promise<Response> {
  const auth = await createAuth();
  const signOutResult = await (auth as SignOutAuthApi).api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });
  const headers = new Headers(signOutResult.headers);
  headers.set("location", new URL("/login", request.url).toString());

  return new Response(null, {
    headers,
    status: 302,
  });
}
