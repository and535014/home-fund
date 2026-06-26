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
import { readSearchParam, type AppSearchParams } from "../route-search-params";
import { unauthenticatedViewFor } from "./unauthenticated-reasons";

type UnauthenticatedPageProps = {
  searchParams?: AppSearchParams;
};

export default async function UnauthenticatedPage({
  searchParams,
}: UnauthenticatedPageProps) {
  const resolvedSearchParams = await searchParams;
  const view = unauthenticatedViewFor(readSearchParam(resolvedSearchParams, "reason"));
  const authError = readSearchParam(resolvedSearchParams, "auth_error");

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <Card aria-labelledby="unauthenticated-title" className="w-full max-w-sm">
        <CardHeader>
          <CardDescription>家庭共用金管理</CardDescription>
          <CardTitle>
            <h1 id="unauthenticated-title" className="text-heading leading-tight">
              {view.title}
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">{view.description}</p>
          {authError ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>{authErrorMessageFor(authError)}</AlertDescription>
            </Alert>
          ) : null}
          {view.canStartGoogleSignIn ? (
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
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

function authErrorMessageFor(authError: string): string {
  if (authError === "state_mismatch") {
    return "登入驗證狀態已失效，請重新點選 Google 登入。若仍發生，請清除 localhost 的 cookie 後再試一次。";
  }

  return "Google 登入沒有完成，請重新嘗試。";
}
