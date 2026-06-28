import { redirect } from "next/navigation";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { getPrismaClient } from "@/db/prisma";
import { loadHouseholdCategories } from "@/modules/categorization/category-query";
import { RecurringRulesPrototype } from "./recurring-rules-prototype";

export default async function RecurringSettingsPage() {
  const session = await requireAuthenticatedMember();

  if (!session.accessHints.actions.canManageRecurringEvents) {
    redirect("/");
  }

  const prisma = getPrismaClient();
  const householdId = session.access.member.householdId;
  const [members, categories] = await Promise.all([
    prisma.member.findMany({
      where: {
        householdId,
      },
      orderBy: {
        displayName: "asc",
      },
      select: {
        id: true,
        displayName: true,
      },
    }),
    loadHouseholdCategories({ householdId, prisma }),
  ]);

  return (
    <PageLayout
      contentClassName="h-full min-h-0 overflow-hidden"
      header={
        <PageHeader
          hideOnMobile
          title="週期事件"
        />
      }
    >
      <RecurringRulesPrototype
        categories={categories}
        members={members}
      />
    </PageLayout>
  );
}
