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
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS as CATEGORY_ICON_OPTION_DEFINITIONS,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  getCategoryColorCssColor,
  type CategoryColorKey,
  type CategoryIconKey,
} from "@/modules/categorization/category-visual-options";

export {
  CATEGORY_COLOR_OPTIONS,
  getCategoryColorCssColor,
  type CategoryColorKey,
  type CategoryIconKey,
};

type CategoryLike = {
  color: CategoryColorKey;
  id?: string;
  icon: CategoryIconKey;
  name: string;
  sortOrder: number;
  status?: "active" | "archived";
  type?: "income" | "expense";
};

export type CategoryVisual = {
  color: CategoryColorKey;
  icon: CategoryIconKey;
  sortOrder: number;
};

export const CATEGORY_ICON_OPTIONS: Array<{
  Icon: LucideIcon;
  key: CategoryIconKey;
  label: string;
}> = CATEGORY_ICON_OPTION_DEFINITIONS.map((option) => ({
  ...option,
  Icon: getIconComponent(option.key),
}));

const ICON_BY_KEY = new Map(
  [
    ...CATEGORY_ICON_OPTIONS,
    { Icon: Shapes, key: "shapes" as const, label: "一般" },
  ].map((option) => [option.key, option] as const),
);

export function getCategoryVisual(category: CategoryLike): CategoryVisual {
  return {
    color: category.color ?? DEFAULT_CATEGORY_COLOR,
    icon: category.icon ?? DEFAULT_CATEGORY_ICON,
    sortOrder: category.sortOrder ?? 0,
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
  color: CategoryColorKey;
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
      style={{ backgroundColor: getCategoryColorCssColor(color) }}
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

function getIconComponent(icon: CategoryIconKey): LucideIcon {
  const icons: Record<CategoryIconKey, LucideIcon> = {
    "badge-dollar-sign": BadgeDollarSign,
    "briefcase-business": BriefcaseBusiness,
    bus: Bus,
    "graduation-cap": GraduationCap,
    "heart-pulse": HeartPulse,
    home: Home,
    "piggy-bank": PiggyBank,
    shapes: Shapes,
    "shopping-cart": ShoppingCart,
    sparkles: Sparkles,
    tags: Tags,
    utensils: Utensils,
    wifi: Wifi,
  };

  return icons[icon];
}
