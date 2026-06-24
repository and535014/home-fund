"use client";

import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type SettingsSidebarItem = {
  href: string;
  label: string;
};

export function SettingsSidebarNav({
  items,
}: {
  items: SettingsSidebarItem[];
}) {
  const pathname = usePathname() ?? "";

  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} size="lg">
              <a aria-current={active ? "page" : undefined} href={item.href}>
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function SettingsMobileNav({ items }: { items: SettingsSidebarItem[] }) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="設定導覽"
      className="mx-4 mb-3 grid h-12 grid-flow-col auto-cols-fr items-center rounded-button border border-border bg-muted/35 p-1 text-muted-foreground"
    >
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <a
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center rounded-button px-3 text-label whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export function SettingsLogoutButton({ className }: { className?: string }) {
  return (
    <SidebarMenu className={className}>
      <SidebarMenuItem>
        <form action="/auth/logout" method="post">
          <SidebarMenuButton asChild size="lg">
            <button className="w-full" type="submit">
              <LogOut aria-hidden="true" size={18} />
              <span>登出</span>
            </button>
          </SidebarMenuButton>
        </form>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
