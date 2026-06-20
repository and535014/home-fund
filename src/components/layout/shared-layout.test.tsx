import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
    href: "/settings",
    icon: APP_NAVIGATION_ICONS.home,
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

    expect(html).toContain("家庭共用金");
    expect(html).not.toContain("月報工作台");
    expect(html).not.toContain("目前使用者");
    expect(html).toContain("設定");
    expect(html).toContain("/settings");
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
            description="邀請家庭成員、管理全站顯示名稱。"
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

    expect(html).toContain("邀請家庭成員、管理全站顯示名稱。");
    expect(html).toContain("邀請成員");
    expect(html).toContain("member rows");
    expect(html).toContain("page status");
    expect(html).toContain("fixed inset-x-0 bottom-0");
  });
});
