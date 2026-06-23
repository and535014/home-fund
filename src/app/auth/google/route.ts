import { startGoogleSignIn } from "@/auth/google-sign-in";
import { createAuth } from "@/auth";

export async function POST(request: Request): Promise<Response> {
  const auth = await createAuth();
  const formData = await request.formData();
  const inviteToken = readFormValue(formData, "inviteToken");
  const bindToken = readFormValue(formData, "bindToken");

  return startGoogleSignIn({
    headers: request.headers,
    auth,
    inviteToken,
    bindToken,
  });
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" && value ? value : undefined;
}
