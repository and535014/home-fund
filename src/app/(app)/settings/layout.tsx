import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-layout";

const settingsItems = [
  { href: "/settings/account", label: "帳號資訊" },
  { href: "/settings/members", label: "成員" },
  { href: "/settings/categories", label: "分類" },
];

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuthenticatedMember();
  const displayName = session.profile.displayName;

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden">
      <PageHeader title="設定" />
      <div className="grid min-h-0 flex-1 grid-cols-[18rem_minmax(0,1fr)] overflow-hidden">
        <aside className="border-r border-border bg-card/30">
          <div className="border-b border-border px-5 py-6">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-11">
                <AvatarImage alt={`${displayName} 的頭像`} src={session.profile.avatarUrl} />
                <AvatarFallback>{avatarFallbackFor(displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-body-strong text-foreground">
                  {displayName}
                </p>
                <p className="text-caption text-muted-foreground">帳號資訊</p>
              </div>
            </div>
          </div>
          <nav aria-label="設定導覽" className="grid p-3">
            {settingsItems.map((item) => (
              <Button
                asChild
                className="h-12 justify-start"
                key={item.href}
                variant="ghost"
              >
                <a href={item.href}>{item.label}</a>
              </Button>
            ))}
            <form action="/auth/logout" method="post">
              <Button className="h-12 w-full justify-start" type="submit" variant="ghost">
                <LogOut aria-hidden="true" size={18} />
                登出
              </Button>
            </form>
          </nav>
        </aside>
        <main className="min-h-0 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

function avatarFallbackFor(displayName: string): string {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return "?";
  }

  return trimmed.slice(0, 1).toUpperCase();
}
