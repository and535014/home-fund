import { startGoogleSignIn } from "@/auth/google-sign-in";
import { createAuth } from "@/auth";

export async function POST(request: Request): Promise<Response> {
  const auth = await createAuth();

  return startGoogleSignIn({
    headers: request.headers,
    auth,
  });
}
