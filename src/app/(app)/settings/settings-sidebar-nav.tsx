"use client";

import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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

export function SettingsLogoutButton() {
  return (
    <SidebarMenu>
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
