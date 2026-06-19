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

type InviteAcceptPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InviteAcceptPage({
  searchParams,
}: InviteAcceptPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = readSearchParam(resolvedSearchParams, "token");
  const error = readSearchParam(resolvedSearchParams, "auth_error");

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
            請使用收到邀請的 Google 帳號登入，登入後會繼續完成加入流程。
          </p>
          {!token ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>
                這個邀請連結缺少 token，請向管理者索取新的邀請連結。
              </AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>
                Google 登入沒有完成，請確認帳號或重新嘗試。
              </AlertDescription>
            </Alert>
          ) : null}
          <form action="/auth/google" method="post">
            <input name="inviteToken" type="hidden" value={token ?? ""} />
            <Button
              className="mt-5 w-full"
              disabled={!token}
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
