import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const error = readSearchParam(resolvedSearchParams, "auth_error");

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <Card aria-labelledby="login-title" className="w-full max-w-sm">
        <CardHeader>
          <CardDescription>家庭共用金管理</CardDescription>
          <CardTitle>
            <h1 id="login-title" className="text-heading leading-tight">
              使用 Google 登入
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">
            請使用管理者已邀請的 Google 帳號登入。Google 只證明身分，家庭成員資格仍由 app 判斷。
          </p>
          {error ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>
                Google 登入沒有完成，請確認帳號或重新嘗試。
              </AlertDescription>
            </Alert>
          ) : null}
          <form action="/auth/google" method="post">
            <Button className="mt-5 w-full" size="lg" type="submit">
              <Users aria-hidden="true" size={18} />
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
