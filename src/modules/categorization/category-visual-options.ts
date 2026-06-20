export type CategoryColorKey = "teal" | "blue" | "violet" | "rose" | "gold" | "lime";

export type CategoryIconKey =
  | "badge-dollar-sign"
  | "briefcase-business"
  | "bus"
  | "graduation-cap"
  | "heart-pulse"
  | "home"
  | "piggy-bank"
  | "shapes"
  | "shopping-cart"
  | "sparkles"
  | "tags"
  | "utensils"
  | "wifi";

export type CategoryColorOption = {
  cssColor: string;
  label: string;
  value: CategoryColorKey;
};

export type CategoryIconOption = {
  key: CategoryIconKey;
  label: string;
};

export const DEFAULT_CATEGORY_COLOR: CategoryColorKey = "gold";
export const DEFAULT_CATEGORY_ICON: CategoryIconKey = "tags";

export const CATEGORY_COLOR_OPTIONS = [
  { cssColor: "#2dd4bf", label: "松綠", value: "teal" },
  { cssColor: "#60a5fa", label: "藍", value: "blue" },
  { cssColor: "#a78bfa", label: "紫", value: "violet" },
  { cssColor: "#fb7185", label: "玫瑰", value: "rose" },
  { cssColor: "#fbbf24", label: "金", value: "gold" },
  { cssColor: "#a3e635", label: "萊姆", value: "lime" },
] as const satisfies readonly CategoryColorOption[];

export const CATEGORY_ICON_OPTIONS = [
  { key: "shopping-cart", label: "購物" },
  { key: "utensils", label: "餐飲" },
  { key: "wifi", label: "通訊" },
  { key: "bus", label: "交通" },
  { key: "home", label: "住家" },
  { key: "heart-pulse", label: "醫療" },
  { key: "graduation-cap", label: "教育" },
  { key: "piggy-bank", label: "儲蓄" },
  { key: "badge-dollar-sign", label: "收入" },
  { key: "briefcase-business", label: "工作" },
  { key: "sparkles", label: "其他" },
  { key: "tags", label: "分類" },
] as const satisfies readonly CategoryIconOption[];

const CATEGORY_COLOR_KEYS = new Set<string>(
  CATEGORY_COLOR_OPTIONS.map((option) => option.value),
);
const CATEGORY_ICON_KEYS = new Set<string>(
  [...CATEGORY_ICON_OPTIONS, { key: "shapes", label: "一般" }].map(
    (option) => option.key,
  ),
);

export function isCategoryColorKey(value: unknown): value is CategoryColorKey {
  return typeof value === "string" && CATEGORY_COLOR_KEYS.has(value);
}

export function isCategoryIconKey(value: unknown): value is CategoryIconKey {
  return typeof value === "string" && CATEGORY_ICON_KEYS.has(value);
}

export function getCategoryColorCssColor(color: CategoryColorKey): string {
  return (
    CATEGORY_COLOR_OPTIONS.find((option) => option.value === color)?.cssColor ??
    CATEGORY_COLOR_OPTIONS[0].cssColor
  );
}

export function deriveDefaultCategoryVisual(seedValue: string): {
  color: CategoryColorKey;
  icon: CategoryIconKey;
} {
  const seed = hashCategory(seedValue);
  const colors = CATEGORY_COLOR_OPTIONS.map((option) => option.value);
  const icons = CATEGORY_ICON_OPTIONS.map((option) => option.key);

  return {
    color: colors[seed % colors.length],
    icon: icons[seed % icons.length],
  };
}

function hashCategory(value: string): number {
  return [...value].reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % 997;
  }, 7);
}
