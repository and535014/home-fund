import { AlertTriangle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BindPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MemberBindPage({ searchParams }: BindPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = readSearchParam(resolvedSearchParams, "token");
  const state = readSearchParam(resolvedSearchParams, "state");
  const errorState = resolveBindErrorState(token, state);

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
                <AlertDescription>{bindErrorMessage(errorState)}</AlertDescription>
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
              <form action="/auth/google" method="post">
                <input name="bindToken" type="hidden" value={token ?? ""} />
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

function resolveBindErrorState(
  token: string | undefined,
  state: string | undefined,
): "missing" | "expired" | "invalid" | "used" | undefined {
  if (!token) {
    return "missing";
  }

  if (
    state === "expired" ||
    state === "invalid" ||
    state === "used"
  ) {
    return state;
  }

  return undefined;
}

function bindErrorMessage(
  state: "missing" | "expired" | "invalid" | "used",
): string {
  const messages = {
    expired: "這個綁定連結已過期，請向管理者索取新的連結。",
    invalid: "這個綁定連結無法使用，請向管理者確認。",
    missing: "這個綁定連結缺少必要資訊，請向管理者索取新的連結。",
    used: "這個綁定連結已使用過，請直接登入或向管理者確認。",
  };

  return messages[state];
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
