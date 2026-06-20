export const APP_NAVIGATION_ICONS = {
  calendarClock: "calendar-clock",
  circleDollarSign: "circle-dollar-sign",
  handCoins: "hand-coins",
  home: "home",
  listChecks: "list-checks",
  plus: "plus",
  receiptText: "receipt-text",
  repeat: "repeat",
  search: "search",
  settings: "settings",
  tags: "tags",
  users: "users",
} as const;

export type AppNavigationIconName =
  typeof APP_NAVIGATION_ICONS[keyof typeof APP_NAVIGATION_ICONS];
