import { redirect } from "next/navigation";
import { createAuth } from "@/auth";
import { getPrismaClient } from "@/db/prisma";
import { acceptMemberInvitationInDatabase } from "@/modules/identity-access/member-invitation-command";

type InviteCallbackSessionUser = {
  id: string;
  email?: string | null;
  image?: string | null;
  name?: string | null;
};

type InviteCallbackSession = {
  user: InviteCallbackSessionUser;
} | null;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: request.headers,
  }) as InviteCallbackSession;

  if (!session) {
    redirect(inviteErrorUrl(token, "google_sign_in"));
  }

  const googleAccount = await getPrismaClient().account.findFirst({
    where: {
      providerId: "google",
      userId: session.user.id,
    },
    select: {
      accountId: true,
    },
  });

  if (!googleAccount) {
    redirect(inviteErrorUrl(token, "google_sign_in"));
  }

  const result = await acceptMemberInvitationInDatabase({
    token,
    googleEmail: session.user.email ?? undefined,
    googleSubject: googleAccount.accountId,
    googleDisplayName: session.user.name?.trim() || undefined,
    googleAvatarUrl: session.user.image?.trim() || undefined,
  }, {
    prisma: getPrismaClient(),
  });

  if (!result.ok) {
    redirect(inviteErrorUrl(token, result.reason));
  }

  redirect("/");
}

function inviteErrorUrl(token: string, reason: string): string {
  const params = new URLSearchParams({
    auth_error: reason,
  });

  if (token) {
    params.set("token", token);
  }

  return `/invite/accept?${params.toString()}`;
}
