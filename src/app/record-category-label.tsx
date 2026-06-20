import { CategoryVisualMark, getCategoryVisual } from "@/app/category-visuals";
import { ItemTitle } from "@/components/ui/item";

export function RecordCategoryLabel({ name }: { name: string }) {
  const visual = getCategoryVisual({ name });

  return (
    <ItemTitle aria-label={name} className="flex justify-center">
      <CategoryVisualMark color={visual.color} icon={visual.icon} />
    </ItemTitle>
  );
}
