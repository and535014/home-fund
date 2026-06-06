import { createAuth } from "@/auth";

async function handleAuth(request: Request): Promise<Response> {
  return createAuth().handler(request);
}

export const GET = handleAuth;
export const POST = handleAuth;
