import { AlertTriangle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPrismaClient } from "@/db/prisma";
import { validateMemberBindingTokenInDatabase } from "@/modules/identity-access/member-invitation-command";
import {
  mapMemberBindTokenState,
  memberBindAuthErrorMessage,
  memberBindErrorMessage,
} from "./member-bind-state";

type BindPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MemberBindPage({ searchParams }: BindPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = readSearchParam(resolvedSearchParams, "token");
  const authError = readSearchParam(resolvedSearchParams, "auth_error");
  const validation = await validateMemberBindingTokenInDatabase(token, {
    prisma: getPrismaClient(),
  });
  const bindState = mapMemberBindTokenState(token, validation);
  const errorState = bindState.kind === "valid" ? undefined : bindState.kind;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <Card aria-labelledby="bind-title" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 id="bind-title" className="text-heading leading-tight">
              {errorState ? "綁定連結無法使用" : "綁定 Google 帳號"}
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errorState ? (
            <>
              <Alert variant="destructive">
                <AlertTriangle aria-hidden="true" />
                <AlertDescription>{memberBindErrorMessage(errorState)}</AlertDescription>
              </Alert>
              <Button asChild variant="secondary">
                <a href="/login">返回登入頁</a>
              </Button>
            </>
          ) : (
            <>
              <p className="text-body text-muted-foreground">
                使用 Google 登入後，這個帳號會綁定到管理者建立的成員資料。
              </p>
              {authError ? (
                <Alert variant="destructive">
                  <AlertTriangle aria-hidden="true" />
                  <AlertDescription>
                    {memberBindAuthErrorMessage(authError)}
                  </AlertDescription>
                </Alert>
              ) : null}
              <form action="/auth/google" method="post">
                <input
                  name="bindToken"
                  type="hidden"
                  value={bindState.kind === "valid" ? bindState.token : ""}
                />
                <Button className="w-full" size="lg" type="submit">
                  <LogIn aria-hidden="true" size={18} />
                  使用 Google 登入
                </Button>
              </form>
            </>
          )}
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

  return Array.isArray(value) ? value[0] : value;
}
