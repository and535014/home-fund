import { createAuth } from "@/auth";

async function handleAuth(request: Request): Promise<Response> {
  const auth = await createAuth();

  return auth.handler(request);
}

export const GET = handleAuth;
export const POST = handleAuth;
