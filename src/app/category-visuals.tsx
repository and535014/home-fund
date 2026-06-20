import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Bus,
  GraduationCap,
  HeartPulse,
  Home,
  PiggyBank,
  Shapes,
  ShoppingCart,
  Sparkles,
  Tags,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryLike = {
  color?: string;
  id?: string;
  icon?: CategoryIconKey;
  name: string;
  sortOrder?: number;
  type?: "income" | "expense";
};

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

export type CategoryVisual = {
  color: string;
  icon: CategoryIconKey;
  sortOrder: number;
};

export const CATEGORY_COLOR_OPTIONS = [
  { label: "松綠", value: "#2dd4bf" },
  { label: "藍", value: "#60a5fa" },
  { label: "紫", value: "#a78bfa" },
  { label: "玫瑰", value: "#fb7185" },
  { label: "金", value: "#fbbf24" },
  { label: "萊姆", value: "#a3e635" },
] as const;

export const CATEGORY_ICON_OPTIONS: Array<{
  Icon: LucideIcon;
  key: CategoryIconKey;
  label: string;
}> = [
  { Icon: ShoppingCart, key: "shopping-cart", label: "購物" },
  { Icon: Utensils, key: "utensils", label: "餐飲" },
  { Icon: Wifi, key: "wifi", label: "通訊" },
  { Icon: Bus, key: "bus", label: "交通" },
  { Icon: Home, key: "home", label: "住家" },
  { Icon: HeartPulse, key: "heart-pulse", label: "醫療" },
  { Icon: GraduationCap, key: "graduation-cap", label: "教育" },
  { Icon: PiggyBank, key: "piggy-bank", label: "儲蓄" },
  { Icon: BadgeDollarSign, key: "badge-dollar-sign", label: "收入" },
  { Icon: BriefcaseBusiness, key: "briefcase-business", label: "工作" },
  { Icon: Sparkles, key: "sparkles", label: "其他" },
  { Icon: Tags, key: "tags", label: "分類" },
];

const ICON_BY_KEY = new Map(
  [
    ...CATEGORY_ICON_OPTIONS,
    { Icon: Shapes, key: "shapes" as const, label: "一般" },
  ].map((option) => [option.key, option] as const),
);

const VISUAL_BY_NAME = new Map<string, CategoryVisual>([
  ["房租", { color: "#60a5fa", icon: "home", sortOrder: 10 }],
  ["薪資", { color: "#2dd4bf", icon: "badge-dollar-sign", sortOrder: 20 }],
  ["日用品", { color: "#fbbf24", icon: "shopping-cart", sortOrder: 10 }],
  ["網路費", { color: "#a78bfa", icon: "wifi", sortOrder: 20 }],
  ["網路", { color: "#a78bfa", icon: "wifi", sortOrder: 20 }],
  ["餐飲", { color: "#fb7185", icon: "utensils", sortOrder: 30 }],
  ["交通", { color: "#a3e635", icon: "bus", sortOrder: 40 }],
  ["水電費", { color: "#60a5fa", icon: "home", sortOrder: 50 }],
]);

const FALLBACK_COLORS = CATEGORY_COLOR_OPTIONS.map((option) => option.value);
const FALLBACK_ICONS = CATEGORY_ICON_OPTIONS.map((option) => option.key);

export function getCategoryVisual(category: CategoryLike): CategoryVisual {
  if (category.color && category.icon && category.sortOrder !== undefined) {
    return {
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
    };
  }

  const knownVisual = VISUAL_BY_NAME.get(category.name);

  if (knownVisual) {
    return {
      color: category.color ?? knownVisual.color,
      icon: category.icon ?? knownVisual.icon,
      sortOrder: category.sortOrder ?? knownVisual.sortOrder,
    };
  }

  const seed = hashCategory(category.id ?? category.name);
  return {
    color: category.color ?? FALLBACK_COLORS[seed % FALLBACK_COLORS.length],
    icon: category.icon ?? FALLBACK_ICONS[seed % FALLBACK_ICONS.length],
    sortOrder: category.sortOrder ?? 100 + seed,
  };
}

export function compareCategoryVisualOrder<T extends CategoryLike>(
  left: T,
  right: T,
): number {
  const leftVisual = getCategoryVisual(left);
  const rightVisual = getCategoryVisual(right);

  if (left.type && right.type && left.type !== right.type) {
    return left.type.localeCompare(right.type);
  }

  if (leftVisual.sortOrder !== rightVisual.sortOrder) {
    return leftVisual.sortOrder - rightVisual.sortOrder;
  }

  return left.name.localeCompare(right.name);
}

export function CategoryVisualMark({
  className,
  color,
  icon,
  size = "default",
}: {
  className?: string;
  color: string;
  icon: CategoryIconKey;
  size?: "sm" | "default" | "lg";
}) {
  const Icon = ICON_BY_KEY.get(icon)?.Icon ?? Shapes;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-background",
        size === "sm" && "size-7",
        size === "default" && "size-9",
        size === "lg" && "size-14",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <Icon
        size={size === "sm" ? 15 : size === "lg" ? 24 : 18}
        strokeWidth={2.2}
      />
    </span>
  );
}

export function CategoryVisualLabel({
  category,
  className,
  compact = false,
  orientation = "horizontal",
}: {
  category: CategoryLike;
  className?: string;
  compact?: boolean;
  orientation?: "horizontal" | "vertical";
}) {
  const visual = getCategoryVisual(category);

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-2",
        orientation === "vertical" && "flex-col text-center",
        compact ? "text-caption" : "text-body",
        className,
      )}
    >
      <CategoryVisualMark
        color={visual.color}
        icon={visual.icon}
        size={compact ? "sm" : "default"}
      />
      <span
        className={cn(
          "truncate",
          orientation === "vertical" && "max-w-full text-label text-muted-foreground",
        )}
      >
        {category.name}
      </span>
    </span>
  );
}

function hashCategory(value: string): number {
  return [...value].reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % 997;
  }, 7);
}
