import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { createHomeDashboardDataSource } from "@/app/home-dashboard-data-source";
import { RecordSearchPanel } from "./_components/record-search-panel";
import { PageLayout } from "@/components/layout/page-layout";

export default async function SearchPage() {
  const session = await requireAuthenticatedMember();
  const dashboardData = await createHomeDashboardDataSource(
    getPrismaClient(),
  ).getSearchPageData(session.access.member.householdId);
  const categoriesById = Object.fromEntries(
    dashboardData.categories.map((category) => [category.id, category]),
  );
  const memberNames = Object.fromEntries(
    dashboardData.householdMembers.map((member) => [
      member.id,
      member.displayName,
    ]),
  );

  return (
    <PageLayout contentClassName="flex h-full min-h-0 flex-col pb-5">
      <section
        aria-label="搜尋紀錄"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <RecordSearchPanel
          actor={session.profile}
          categories={dashboardData.categories}
          categoriesById={categoriesById}
          memberNames={memberNames}
        />
      </section>
    </PageLayout>
  );
}
