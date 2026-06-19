import { MailPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrismaClient } from "@/db/prisma";
import { validateMemberInvitationTokenInDatabase } from "@/modules/identity-access/member-invitation-command";

type InviteAcceptPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InviteAcceptPage({
  searchParams,
}: InviteAcceptPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = readSearchParam(resolvedSearchParams, "token");
  const error = readSearchParam(resolvedSearchParams, "auth_error");
  const invitationState = await validateMemberInvitationTokenInDatabase(token, {
    prisma: getPrismaClient(),
  });
  const tokenError = invitationState.ok ? undefined : invitationState.reason;
  const canSubmit = invitationState.ok;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <Card aria-labelledby="invite-title" className="w-full max-w-sm">
        <CardHeader>
          <CardDescription>家庭共用金邀請</CardDescription>
          <CardTitle>
            <h1 id="invite-title" className="text-heading leading-tight">
              接受成員邀請
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">
            使用 Google 登入即可接受邀請。
          </p>
          {tokenError ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>
                {inviteTokenErrorMessage(tokenError)}
              </AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>
                {inviteAuthErrorMessage(error)}
              </AlertDescription>
            </Alert>
          ) : null}
          <form action="/auth/google" method="post">
            <input name="inviteToken" type="hidden" value={token ?? ""} />
            <Button
              className="mt-5 w-full"
              disabled={!canSubmit}
              size="lg"
              type="submit"
            >
              <MailPlus aria-hidden="true" size={18} />
              <span>使用 Google 登入</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function inviteTokenErrorMessage(
  reason:
    | "missing_token"
    | "invalid_invite"
    | "expired_invite"
    | "accepted_invite"
    | "revoked_invite",
): string {
  const messages = {
    accepted_invite: "這個邀請連結已經使用過，請直接登入或向管理者確認。",
    expired_invite: "這個邀請連結已過期，請向管理者索取新的邀請連結。",
    invalid_invite: "這個邀請連結無效，請向管理者索取新的邀請連結。",
    missing_token: "這個邀請連結缺少 token，請向管理者索取新的邀請連結。",
    revoked_invite: "這個邀請連結已撤銷，請向管理者索取新的邀請連結。",
  };

  return messages[reason];
}

function inviteAuthErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    accepted_invite: "這個邀請連結已經使用過，請直接登入或向管理者確認。",
    expired_invite: "這個邀請連結已過期，請向管理者索取新的邀請連結。",
    invalid_invite: "這個邀請連結無效，請向管理者索取新的邀請連結。",
    revoked_invite: "這個邀請連結已撤銷，請向管理者索取新的邀請連結。",
    google_account_already_member: "這個 Google 帳號已經是成員，請直接登入。",
    missing_google_account: "Google 登入沒有提供 email，請換一個 Google 帳號或重新嘗試。",
  };

  return messages[error] ?? "Google 登入沒有完成，請確認帳號或重新嘗試。";
}

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  if (!searchParams) {
    return undefined;
  }

  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
