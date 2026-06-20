import { CategoryVisualMark, getCategoryVisual } from "@/app/category-visuals";
import { ItemTitle } from "@/components/ui/item";
import type { Category } from "@/modules/categorization/category-catalog";

export function RecordCategoryLabel({ category }: { category: Category }) {
  const visual = getCategoryVisual(category);

  return (
    <ItemTitle aria-label={category.name} className="flex justify-center">
      <CategoryVisualMark color={visual.color} icon={visual.icon} />
    </ItemTitle>
  );
}
