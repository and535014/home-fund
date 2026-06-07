import { Users } from "lucide-react";
import type { HomeBlockedView } from "./home-access";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardAccessScreen({ view }: { view: HomeBlockedView }) {
  const canStartGoogleSignIn =
    view.kind === "unauthenticated" || view.kind === "google_account_not_linked";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <Card aria-labelledby="access-state-title" className="w-full max-w-sm">
        <CardHeader>
          <CardDescription>家庭共用金管理</CardDescription>
          <CardTitle>
            <h1 id="access-state-title" className="text-heading leading-tight">
              {view.title}
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground">{view.description}</p>
          {view.errorMessage ? (
            <Alert className="mt-4 text-body" role="alert" variant="destructive">
              <AlertDescription>{view.errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          {canStartGoogleSignIn ? (
            <form action="/auth/google" method="post">
              <Button className="mt-5 w-full" size="lg" type="submit">
                <Users aria-hidden="true" size={18} />
                <span>{view.primaryActionLabel}</span>
              </Button>
            </form>
          ) : (
            <Button className="mt-5 w-full" size="lg" type="button">
              <Users aria-hidden="true" size={18} />
              <span>{view.primaryActionLabel}</span>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
