import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecordCreateContext } from "@/app/record-create-context";
import {
  AuthenticatedLayout,
  type AppNavigationItem,
} from "./authenticated-layout";
import { APP_NAVIGATION_ICONS } from "./app-navigation-icons";
import {
  MobileActionBar,
  PageContent,
  PageFooter,
  PageHeader,
  PageLayout,
} from "./page-layout";

const navigationItems: AppNavigationItem[] = [
  {
    href: "/",
    icon: APP_NAVIGATION_ICONS.home,
    label: "總覽",
  },
  {
    href: "/search",
    icon: APP_NAVIGATION_ICONS.search,
    label: "搜尋",
  },
  {
    href: "/settings/account",
    icon: APP_NAVIGATION_ICONS.settings,
    label: "設定",
  },
];

describe("shared app layout", () => {
  it("keeps authenticated sidebar layout separate from page header content", async () => {
    const layout = await AuthenticatedLayout({
      accountOverride: { displayName: "Lin 管理者" },
      navigation: navigationItems,
      children: (
        <main>
          <h2>設定</h2>
        </main>
      ),
    });
    const html = renderToStaticMarkup(
      layout,
    );

    expect(html).not.toContain("家庭共用金");
    expect(html).not.toContain("月報工作台");
    expect(html).not.toContain("目前使用者");
    expect(html).toContain("設定");
    expect(html).toContain("/settings/account");
    expect(html).not.toContain("邀請家庭成員");
  });

  it("renders page anatomy through page layout slots", () => {
    const html = renderToStaticMarkup(
      <PageLayout
        footer={
          <MobileActionBar>
            <button type="button">邀請</button>
          </MobileActionBar>
        }
        header={
          <PageHeader
            actions={<button type="button">邀請成員</button>}
            title="成員"
          />
        }
      >
        <PageContent>
          <section>member rows</section>
        </PageContent>
        <PageFooter>page status</PageFooter>
      </PageLayout>,
    );

    expect(html).not.toContain("邀請家庭成員、管理全站顯示名稱。");
    expect(html).toContain("邀請成員");
    expect(html).toContain("member rows");
    expect(html).toContain("page status");
    expect(html).toContain("fixed inset-x-0 bottom-0");
  });

  it("renders mobile bottom navigation and create FAB from the app shell", async () => {
    const layout = await AuthenticatedLayout({
      accountOverride: { displayName: "Lin 管理者" },
      canCreateRecord: true,
      navigation: navigationItems,
      children: <main>dashboard</main>,
    });
    const html = renderToStaticMarkup(
      <RecordCreateContext.Provider
        value={{
          canCreateRecordsForOthers: false,
          categories: [],
          close: () => undefined,
          isCreatePending: false,
          members: [],
          mode: null,
          onRecordCreated: () => undefined,
          onRecurringEventCreated: () => undefined,
          openExpense: () => undefined,
          openIncome: () => undefined,
          setCreatePending: () => undefined,
          profile: {
            capabilities: ["manage_categories"],
            id: "member-1",
            householdId: "household-demo",
            displayName: "Lin 管理者",
            roles: ["admin"],
          },
        }}
      >
        {layout}
      </RecordCreateContext.Provider>,
    );

    expect(html).toContain('aria-label="主要導覽"');
    expect(html).toContain('aria-label="首頁"');
    expect(html).toContain('href="/"');
    expect(html).toContain('aria-label="搜尋"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('aria-label="設定"');
    expect(html).toContain('href="/settings/account"');
    expect(html).toContain('aria-label="新增紀錄"');
  });
});
