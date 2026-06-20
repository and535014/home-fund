"use client";

import {
  Archive,
  Edit3,
  GripVertical,
  Tags,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  CategoryVisualLabel,
  compareCategoryVisualOrder,
  getCategoryVisual,
  type CategoryIconKey,
} from "@/app/category-visuals";
import type { Category } from "@/modules/categorization/category-catalog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

type CategoryType = Category["type"];

type EditableCategory = Category & {
  color?: string;
  icon?: CategoryIconKey;
  recordCount: number;
  sortOrder?: number;
};

type CategoryManagementPanelProps = {
  categories: EditableCategory[];
};

const OPEN_CATEGORY_CREATE_EVENT = "home-fund:open-category-create";

export function AddCategoryHeaderButton({
  className,
  size,
}: {
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
}) {
  return (
    <Button
      className={className}
      onClick={() => {
        window.dispatchEvent(new Event(OPEN_CATEGORY_CREATE_EVENT));
      }}
      size={size}
      type="button"
    >
      <Tags aria-hidden="true" size={18} />
      新增分類
    </Button>
  );
}

export function CategoryManagementPanel({ categories }: CategoryManagementPanelProps) {
  const [newType, setNewType] = useState<CategoryType>("expense");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLOR_OPTIONS[0].value);
  const [newIcon, setNewIcon] = useState<CategoryIconKey>("tags");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState<string>(
    CATEGORY_COLOR_OPTIONS[0].value,
  );
  const [editingIcon, setEditingIcon] = useState<CategoryIconKey>("tags");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [displayedCategories, setDisplayedCategories] = useState(() =>
    hydrateVisualCategories(categories),
  );

  const activeCategories = displayedCategories
    .filter((category) => category.status === "active")
    .sort(compareCategoryVisualOrder);
  const expenseCategories = activeCategories.filter(
    (category) => category.type === "expense",
  );
  const incomeCategories = activeCategories.filter(
    (category) => category.type === "income",
  );
  const editingCategory =
    displayedCategories.find((category) => category.id === editingId) ?? null;
  const archivingCategory =
    displayedCategories.find((category) => category.id === archivingId) ?? null;

  useEffect(() => {
    function openCreateDialog() {
      setIsCreateDialogOpen(true);
    }

    window.addEventListener(OPEN_CATEGORY_CREATE_EVENT, openCreateDialog);
    return () => {
      window.removeEventListener(OPEN_CATEGORY_CREATE_EVENT, openCreateDialog);
    };
  }, []);

  function submitCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = newName.trim();

    if (!normalizedName) {
      toast.error("請輸入分類名稱。");
      return;
    }

    if (hasDuplicateActiveName(displayedCategories, newType, normalizedName)) {
      toast.error("同類型已有啟用中的相同分類名稱。");
      return;
    }

    const nextSortOrder =
      Math.max(
        0,
        ...displayedCategories
          .filter(
            (category) => category.type === newType && category.status === "active",
          )
          .map((category) => category.sortOrder ?? 0),
      ) + 10;

    setDisplayedCategories((current) => [
      ...current,
      {
        color: newColor,
        icon: newIcon,
        id: `local-${newType}-${Date.now()}`,
        name: normalizedName,
        recordCount: 0,
        sortOrder: nextSortOrder,
        status: "active",
        type: newType,
      },
    ]);
    setNewName("");
    setIsCreateDialogOpen(false);
    toast.success("分類已新增", {
      description: "已加入啟用分類。",
      id: "category-created-local",
    });
  }

  function startRename(category: EditableCategory) {
    const visual = getCategoryVisual(category);
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingColor(category.color ?? visual.color);
    setEditingIcon(category.icon ?? visual.icon);
  }

  function submitRenameCategory(
    event: FormEvent<HTMLFormElement>,
    category: EditableCategory,
  ) {
    event.preventDefault();
    const normalizedName = editingName.trim();

    if (!normalizedName) {
      toast.error("請輸入分類名稱。");
      return;
    }

    if (
      hasDuplicateActiveName(
        displayedCategories.filter((candidate) => candidate.id !== category.id),
        category.type,
        normalizedName,
      )
    ) {
      toast.error("同類型已有啟用中的相同分類名稱。");
      return;
    }

    setDisplayedCategories((current) =>
      current.map((candidate) =>
        candidate.id === category.id
          ? {
              ...candidate,
              color: editingColor,
              icon: editingIcon,
              name: normalizedName,
            }
          : candidate,
      ),
    );
    setEditingId(null);
    toast.success("分類已更新", {
      description: "已更新分類名稱、顏色與 icon。",
      id: "category-renamed-local",
    });
  }

  function startArchive(category: EditableCategory) {
    setArchivingId(category.id);
  }

  function confirmArchiveCategory() {
    if (archivingCategory) {
      setDisplayedCategories((current) =>
        current.map((category) =>
          category.id === archivingCategory.id
            ? { ...category, status: "archived" }
            : category,
        ),
      );
      toast.success("分類已封存", {
        description: "既有紀錄仍會保留原分類。",
        id: "category-archived-local",
      });
    }

    setEditingId(null);
    setArchivingId(null);
  }

  function reorderCategory({
    draggedCategoryId,
    targetCategoryId,
    type,
  }: {
    draggedCategoryId: string;
    targetCategoryId: string;
    type: CategoryType;
  }) {
    if (draggedCategoryId === targetCategoryId) {
      return;
    }

    const sameTypeCategories = activeCategories.filter(
      (candidate) => candidate.type === type,
    );
    const fromIndex = sameTypeCategories.findIndex(
      (candidate) => candidate.id === draggedCategoryId,
    );
    const toIndex = sameTypeCategories.findIndex(
      (candidate) => candidate.id === targetCategoryId,
    );

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const reordered = [...sameTypeCategories];
    const [movedCategory] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedCategory);
    const sortOrderById = new Map(
      reordered.map((candidate, index) => [candidate.id, (index + 1) * 10]),
    );

    setDisplayedCategories((current) =>
      current.map((candidate) => {
        const sortOrder = sortOrderById.get(candidate.id);
        return sortOrder ? { ...candidate, sortOrder } : candidate;
      }),
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-5">
      <section
        aria-label="分類列表"
        className="grid min-h-0 gap-4 lg:grid-cols-2"
      >
        <CategoryPanel count={expenseCategories.length} title="支出">
          {expenseCategories.length === 0 ? (
            <CategoryEmptyState />
          ) : (
            <CategoryList
              categories={expenseCategories}
              editingId={editingId}
              onArchive={startArchive}
              onEdit={startRename}
              onReorder={reorderCategory}
              type="expense"
            />
          )}
        </CategoryPanel>
        <CategoryPanel count={incomeCategories.length} title="收入">
          {incomeCategories.length === 0 ? (
            <CategoryEmptyState />
          ) : (
            <CategoryList
              categories={incomeCategories}
              editingId={editingId}
              onArchive={startArchive}
              onEdit={startRename}
              onReorder={reorderCategory}
              type="income"
            />
          )}
        </CategoryPanel>
      </section>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增分類</DialogTitle>
          </DialogHeader>
          <CategoryForm
            color={newColor}
            icon={newIcon}
            name={newName}
            onColorChange={setNewColor}
            onIconChange={setNewIcon}
            onNameChange={setNewName}
            onSubmit={submitCreateCategory}
            onTypeChange={setNewType}
            submitLabel="新增分類"
            type={newType}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={editingCategory !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改分類</DialogTitle>
          </DialogHeader>
          {editingCategory ? (
            <CategoryForm
              categoryId={editingCategory.id}
              color={editingColor}
              icon={editingIcon}
              name={editingName}
              onColorChange={setEditingColor}
              onIconChange={setEditingIcon}
              onNameChange={setEditingName}
              onSubmit={(event) => submitRenameCategory(event, editingCategory)}
              onTypeChange={() => undefined}
              submitLabel="儲存修改"
              type={editingCategory.type}
              typeDisabled
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={archivingCategory !== null}
        onOpenChange={(open) => {
          if (!open) {
            setArchivingId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>封存分類</DialogTitle>
            <DialogDescription>
              封存後，這個分類不會再出現在新增收入或支出的分類選項。
            </DialogDescription>
          </DialogHeader>
          {archivingCategory ? (
            <div className="grid gap-4">
              <div className="rounded-card border border-border bg-muted/40 p-3">
                <CategoryVisualLabel category={archivingCategory} />
                <p className="mt-1 text-caption text-muted-foreground">
                  目前有 {archivingCategory.recordCount} 筆歷史紀錄使用這個分類；封存後既有紀錄仍會保留原分類。
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={() => setArchivingId(null)}
                  type="button"
                  variant="outline"
                >
                  取消
                </Button>
                <form onSubmit={(event) => event.preventDefault()}>
                  <div className="grid gap-2">
                    <input name="categoryId" type="hidden" value={archivingCategory.id} />
                    <Button onClick={confirmArchiveCategory} type="button" variant="destructive">
                      <Archive aria-hidden="true" />
                      確認封存
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryEmptyState() {
  return (
    <div className="grid min-h-32 place-items-center rounded-card border border-dashed border-border text-center">
      <p className="text-caption text-muted-foreground">尚無分類</p>
    </div>
  );
}

function CategoryPanel({
  children,
  count,
  title,
}: {
  children: ReactNode;
  count: number;
  title: string;
}) {
  return (
    <section
      aria-label={`${title}分類`}
      className="flex min-h-0 min-w-0 flex-col justify-start gap-3 overflow-hidden"
    >
      <h3 className="shrink-0 text-body-strong text-foreground">
        {title} ({count})
      </h3>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
        {children}
      </div>
    </section>
  );
}

function CategoryForm({
  categoryId,
  color,
  fieldError,
  icon,
  name,
  onColorChange,
  onIconChange,
  onNameChange,
  onSubmit,
  onTypeChange,
  submitLabel,
  type,
  typeDisabled = false,
}: {
  categoryId?: string;
  color: string;
  fieldError?: string;
  icon: CategoryIconKey;
  name: string;
  onColorChange: (color: string) => void;
  onIconChange: (icon: CategoryIconKey) => void;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTypeChange: (type: CategoryType) => void;
  submitLabel: string;
  type: CategoryType;
  typeDisabled?: boolean;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {categoryId ? <input name="categoryId" type="hidden" value={categoryId} /> : null}
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="category-type">類型</FieldLabel>
            <NativeSelect
              disabled={typeDisabled}
              id="category-type"
              name="type"
              onChange={(event) =>
                onTypeChange(event.currentTarget.value as CategoryType)
              }
              value={type}
            >
              <NativeSelectOption value="income">收入</NativeSelectOption>
              <NativeSelectOption value="expense">支出</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="category-name">分類名稱</FieldLabel>
            <Input
              id="category-name"
              name="name"
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="例如：水電費"
              value={name}
            />
            {fieldError ? <FieldDescription>{fieldError}</FieldDescription> : null}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>顏色</FieldLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {CATEGORY_COLOR_OPTIONS.map((option) => (
                <button
                  aria-checked={color === option.value}
                  aria-label={option.label}
                  className={cn(
                    "grid size-9 place-items-center rounded-input border border-border bg-background transition focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    color === option.value && "border-ring ring-2 ring-ring/35",
                  )}
                  key={option.value}
                  onClick={() => onColorChange(option.value)}
                  role="radio"
                  type="button"
                >
                  <span
                    className="size-5 rounded-full"
                    style={{ backgroundColor: option.value }}
                  />
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel>Icon</FieldLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {CATEGORY_ICON_OPTIONS.map(({ Icon, key, label }) => (
                <button
                  aria-checked={icon === key}
                  aria-label={label}
                  className={cn(
                    "grid size-9 place-items-center rounded-input border border-border bg-background transition focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    icon === key && "border-ring bg-accent text-accent-foreground ring-2 ring-ring/35",
                  )}
                  key={key}
                  onClick={() => onIconChange(key)}
                  role="radio"
                  type="button"
                >
                  <Icon aria-hidden="true" size={17} />
                </button>
              ))}
            </div>
          </Field>
        </div>
      </FieldGroup>
      <Button type="submit">
        <Tags aria-hidden="true" />
        {submitLabel}
      </Button>
    </form>
  );
}

function CategoryList({
  categories,
  editingId,
  onArchive,
  onEdit,
  onReorder,
  type,
}: {
  categories: EditableCategory[];
  editingId: string | null;
  onArchive: (category: EditableCategory) => void;
  onEdit: (category: EditableCategory) => void;
  onReorder: (input: {
    draggedCategoryId: string;
    targetCategoryId: string;
    type: CategoryType;
  }) => void;
  type: CategoryType;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      {categories.map((category) => (
        <CategoryItem
          actions={
            <>
              <Button
                aria-label={`修改 ${category.name}`}
                aria-pressed={editingId === category.id}
                onClick={() => onEdit(category)}
                size="icon-sm"
                type="button"
                variant="secondary"
              >
                <Edit3 aria-hidden="true" />
              </Button>
              <Button
                aria-label={`封存 ${category.name}`}
                onClick={() => onArchive(category)}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <Archive aria-hidden="true" />
              </Button>
            </>
          }
          category={category}
          isActive={editingId === category.id}
          isDragging={draggingId === category.id}
          key={category.id}
          onDragEnd={() => setDraggingId(null)}
          onDragEnter={(targetCategory) => {
            if (!draggingId || draggingId === targetCategory.id) {
              return;
            }

            onReorder({
              draggedCategoryId: draggingId,
              targetCategoryId: targetCategory.id,
              type,
            });
          }}
          onDragStart={(draggedCategory) => {
            setDraggingId(draggedCategory.id);
          }}
        />
      ))}
    </div>
  );
}

function CategoryItem({
  actions,
  category,
  isActive = false,
  isDragging = false,
  onDragEnd,
  onDragEnter,
  onDragStart,
}: {
  actions?: ReactNode;
  category: EditableCategory;
  isActive?: boolean;
  isDragging?: boolean;
  onDragEnd?: () => void;
  onDragEnter?: (category: EditableCategory) => void;
  onDragStart?: (category: EditableCategory) => void;
}) {
  const canReorder = Boolean(onDragStart);

  return (
    <Item
      className={cn(
        "flex-nowrap bg-background transition",
        isActive && "border-ring bg-accent/40",
        isDragging && "opacity-55 ring-2 ring-ring/35",
      )}
      onDragEnd={onDragEnd}
      onDragEnter={() => onDragEnter?.(category)}
      onDragOver={(event) => {
        if (canReorder) {
          event.preventDefault();
        }
      }}
      size="sm"
      variant="outline"
    >
      {canReorder ? (
        <button
          aria-label={`排序 ${category.name}`}
          className="grid size-8 shrink-0 cursor-grab place-items-center rounded-input text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", category.id);
            onDragStart?.(category);
          }}
          type="button"
        >
          <GripVertical aria-hidden="true" size={17} />
        </button>
      ) : null}
      <ItemContent className="min-w-0">
        <ItemTitle className="block">
          <CategoryVisualLabel category={category} />
        </ItemTitle>
      </ItemContent>
      {actions ? (
        <ItemActions className="shrink-0">{actions}</ItemActions>
      ) : null}
    </Item>
  );
}

function seedEditableCategories(
  categories: Category[],
  records: { categoryId: string }[],
): EditableCategory[] {
  const recordCounts = records.reduce((counts, record) => {
    counts.set(record.categoryId, (counts.get(record.categoryId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return categories.map((category) => ({
    ...category,
    ...getCategoryVisual(category),
    recordCount: recordCounts.get(category.id) ?? 0,
  }));
}

export function buildEditableCategories(
  categories: Category[],
  records: { categoryId: string }[],
): EditableCategory[] {
  return seedEditableCategories(categories, records);
}

function hydrateVisualCategories(categories: EditableCategory[]): EditableCategory[] {
  return categories.map((category) => ({
    ...category,
    ...getCategoryVisual(category),
  }));
}

function hasDuplicateActiveName(
  categories: EditableCategory[],
  type: CategoryType,
  name: string,
): boolean {
  return categories.some(
    (category) =>
      category.type === type &&
      category.status === "active" &&
      category.name === name,
  );
}
