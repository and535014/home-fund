import type { AppNavigationItem } from "./authenticated-layout";

export function orderMobileNavigationItems(
  navigationItems: AppNavigationItem[],
) {
  const orderByHref = new Map([
    ["/settings/account", 0],
    ["/", 1],
    ["/search", 2],
  ]);

  return [...navigationItems].sort((first, second) => {
    const firstOrder = orderByHref.get(first.href) ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = orderByHref.get(second.href) ?? Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder;
  });
}

export function mobileNavigationLabel(item: AppNavigationItem) {
  return item.href === "/" ? "首頁" : item.label;
}
