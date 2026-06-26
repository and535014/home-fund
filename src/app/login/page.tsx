import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

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
            和家庭成員一起記錄支出、收入與退款，整理每月共用金流。
          </p>
          {error ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>
                Google 登入沒有完成，請確認帳號或重新嘗試。
              </AlertDescription>
            </Alert>
          ) : null}
          <form action="/auth/google" method="post">
            <FormSubmitButton
              className="mt-5 w-full"
              pendingLabel="登入中..."
              size="lg"
              type="submit"
            >
              <Users aria-hidden="true" size={18} />
              <span>使用 Google 登入</span>
            </FormSubmitButton>
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
