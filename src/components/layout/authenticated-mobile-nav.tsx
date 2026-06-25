"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRecordCreate } from "@/app/record-create-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppNavigationItem } from "./authenticated-layout";
import {
  isActiveNavigationItem,
  navigationIcons,
} from "./authenticated-sidebar-nav";
import {
  mobileNavigationLabel,
  orderMobileNavigationItems,
} from "./mobile-navigation-order";

export function AuthenticatedMobileNav({
  canCreateRecord,
  navigationItems,
}: {
  canCreateRecord: boolean;
  navigationItems: AppNavigationItem[];
}) {
  const pathname = usePathname() ?? "";
  const hideMobileNavigation = pathname === "/search";
  const hideRecordCreateFab = pathname === "/settings" || pathname.startsWith("/settings/");
  const mobileNavigationItems = orderMobileNavigationItems(navigationItems);

  if (hideMobileNavigation) {
    return null;
  }

  return (
    <>
      {canCreateRecord && !hideRecordCreateFab ? <RecordCreateFab /> : null}
      <nav
        aria-label="主要導覽"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-14px_34px_rgba(0,0,0,0.34)] backdrop-blur md:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch gap-1">
          {mobileNavigationItems.map((item) => (
            <AuthenticatedMobileNavItem item={item} key={item.href} />
          ))}
        </div>
      </nav>
    </>
  );
}

function AuthenticatedMobileNavItem({ item }: { item: AppNavigationItem }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentHref =
    searchParams && searchParams.size > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
  const active = isActiveNavigationItem(item.href, pathname, currentHref);
  const Icon = navigationIcons[item.icon];
  const label = mobileNavigationLabel(item);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={cn(
        "grid min-h-14 flex-1 place-items-center rounded-button px-1 py-1.5 text-center text-[0.75rem] leading-none text-muted-foreground transition focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active && "bg-secondary text-foreground",
      )}
      href={item.href}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-5", active && "text-primary")}
      />
    </Link>
  );
}

function RecordCreateFab() {
  const { openExpense } = useRecordCreate();

  return (
    <Button
      aria-label="新增紀錄"
      onClick={openExpense}
      size="fab"
      type="button"
      variant="fab"
    >
      <Plus aria-hidden="true" />
    </Button>
  );
}
