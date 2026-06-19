import type { ReactNode } from "react";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { getVisibleDashboardNavigationItems } from "../dashboard-navigation";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuthenticatedMember();

  return (
    <AuthenticatedLayout
      account={{
        displayName: session.profile.displayName,
        avatarUrl: session.profile.avatarUrl,
      }}
      navigation={getVisibleDashboardNavigationItems(session.accessHints)}
    >
      {children}
    </AuthenticatedLayout>
  );
}
