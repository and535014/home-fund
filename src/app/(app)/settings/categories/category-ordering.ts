type OrderedCategory = {
  id: string;
};

export function getCategoryMoveState({
  categories,
  categoryId,
}: {
  categories: OrderedCategory[];
  categoryId: string;
}) {
  const index = categories.findIndex((category) => category.id === categoryId);

  return {
    canMoveDown: index >= 0 && index < categories.length - 1,
    canMoveUp: index > 0,
  };
}
