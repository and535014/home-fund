"use client";

import {
  Archive,
  ChevronDown,
  ChevronUp,
  Edit3,
  GripVertical,
  Tags,
} from "lucide-react";
import type { ComponentProps, FormEvent, ReactNode } from "react";
import { useState } from "react";

import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  CategoryVisualLabel,
  type CategoryColorKey,
  type CategoryIconKey,
} from "@/app/category-visuals";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { getCategoryMoveState } from "./category-ordering";
import type {
  CategoryType,
  EditableCategory,
} from "./category-management-panel";

export function AddCategoryHeaderButton({
  className,
  onOpen,
  size,
}: {
  className?: string;
  onOpen: () => void;
  size?: ComponentProps<typeof Button>["size"];
}) {
  return (
    <Button
      className={className}
      onClick={onOpen}
      size={size}
      type="button"
    >
      <Tags aria-hidden="true" size={18} />
      新增分類
    </Button>
  );
}

export function AddCategoryMobileFab({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      aria-label="新增分類"
      onClick={onOpen}
      size="fab"
      type="button"
      variant="fab"
    >
      <Tags aria-hidden="true" />
    </Button>
  );
}

export function CategoryEmptyState() {
  return (
    <div className="grid min-h-32 place-items-center rounded-card border border-dashed border-border text-center">
      <p className="text-caption text-muted-foreground">尚無分類</p>
    </div>
  );
}

export function CategoryPanel({
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

export function CategoryForm({
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
  color: CategoryColorKey;
  fieldError?: string;
  icon: CategoryIconKey;
  name: string;
  onColorChange: (color: CategoryColorKey) => void;
  onIconChange: (icon: CategoryIconKey) => void;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTypeChange: (type: CategoryType) => void;
  submitLabel: string;
  type: CategoryType;
  typeDisabled?: boolean;
}) {
  return (
    <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={onSubmit}>
      {categoryId ? <input name="categoryId" type="hidden" value={categoryId} /> : null}
      <input name="color" type="hidden" value={color} />
      <input name="icon" type="hidden" value={icon} />
      <DialogBody>
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
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLOR_OPTIONS.map((option) => (
                  <Toggle
                    aria-label={option.label}
                    className={cn(
                      "p-0",
                      color === option.value && "bg-background",
                    )}
                    key={option.value}
                    onPressedChange={(pressed) => {
                      if (pressed) {
                        onColorChange(option.value);
                      }
                    }}
                    pressed={color === option.value}
                    size="icon"
                    variant="outline"
                  >
                    <span
                      className="size-5 rounded-full"
                      style={{ backgroundColor: option.cssColor }}
                    />
                  </Toggle>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>Icon</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICON_OPTIONS.map(({ Icon, key, label }) => (
                  <Toggle
                    aria-label={label}
                    key={key}
                    onPressedChange={(pressed) => {
                      if (pressed) {
                        onIconChange(key);
                      }
                    }}
                    pressed={icon === key}
                    size="icon"
                    variant="outline"
                  >
                    <Icon aria-hidden="true" size={17} />
                  </Toggle>
                ))}
              </div>
            </Field>
          </div>
        </FieldGroup>
      </DialogBody>
      <DialogFooter>
        <Button type="submit">
          <Tags aria-hidden="true" />
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryArchivePreview({
  category,
}: {
  category: EditableCategory;
}) {
  return (
    <div className="rounded-card border border-border bg-muted/40 p-3">
      <CategoryVisualLabel category={category} />
      <p className="mt-1 text-caption text-muted-foreground">
        目前有 {category.recordCount} 筆歷史紀錄使用這個分類；封存後既有紀錄仍會保留原分類。
      </p>
    </div>
  );
}

export function CategoryList({
  categories,
  editingId,
  onArchive,
  onEdit,
  onReorder,
  pending,
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
  pending?: boolean;
  type: CategoryType;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      {categories.map((category) => (
        <CategoryListItem
          category={category}
          categories={categories}
          draggingId={draggingId}
          editingId={editingId}
          key={category.id}
          onArchive={onArchive}
          onEdit={onEdit}
          onReorder={onReorder}
          onSetDraggingId={setDraggingId}
          pending={pending}
          type={type}
        />
      ))}
    </div>
  );
}

function CategoryListItem({
  category,
  categories,
  draggingId,
  editingId,
  onArchive,
  onEdit,
  onReorder,
  onSetDraggingId,
  pending,
  type,
}: {
  category: EditableCategory;
  categories: EditableCategory[];
  draggingId: string | null;
  editingId: string | null;
  onArchive: (category: EditableCategory) => void;
  onEdit: (category: EditableCategory) => void;
  onReorder: (input: {
    draggedCategoryId: string;
    targetCategoryId: string;
    type: CategoryType;
  }) => void;
  onSetDraggingId: (categoryId: string | null) => void;
  pending?: boolean;
  type: CategoryType;
}) {
  const { canMoveDown, canMoveUp } = getCategoryMoveState({
    categories,
    categoryId: category.id,
  });

  return (
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
      canMoveDown={canMoveDown}
      canMoveUp={canMoveUp}
      category={category}
      isDragging={draggingId === category.id}
      onDragEnd={() => onSetDraggingId(null)}
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
        onSetDraggingId(draggedCategory.id);
      }}
      onMove={(direction) => {
        const currentIndex = categories.findIndex(
          (candidate) => candidate.id === category.id,
        );
        const targetCategory = categories[
          direction === "up" ? currentIndex - 1 : currentIndex + 1
        ];

        if (!targetCategory) {
          return;
        }

        onReorder({
          draggedCategoryId: category.id,
          targetCategoryId: targetCategory.id,
          type,
        });
      }}
      pending={pending}
    />
  );
}

function CategoryItem({
  actions,
  canMoveDown = false,
  canMoveUp = false,
  category,
  isDragging = false,
  onDragEnd,
  onDragEnter,
  onDragStart,
  onMove,
  pending = false,
}: {
  actions?: ReactNode;
  canMoveDown?: boolean;
  canMoveUp?: boolean;
  category: EditableCategory;
  isDragging?: boolean;
  onDragEnd?: () => void;
  onDragEnter?: (category: EditableCategory) => void;
  onDragStart?: (category: EditableCategory) => void;
  onMove?: (direction: "down" | "up") => void;
  pending?: boolean;
}) {
  const canReorder = Boolean(onDragStart);

  return (
    <Item
      className={cn(
        "flex-nowrap transition",
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
        <>
          <button
            aria-label={`排序 ${category.name}`}
            className="hidden size-8 shrink-0 cursor-grab place-items-center rounded-input text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing md:grid"
            disabled={pending}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", category.id);
              onDragStart?.(category);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") {
                event.preventDefault();
                onMove?.("up");
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                onMove?.("down");
              }
            }}
            type="button"
          >
            <GripVertical aria-hidden="true" size={17} />
          </button>
          <div className="flex shrink-0 flex-col gap-1 md:hidden">
            <Button
              aria-label={`上移 ${category.name}`}
              disabled={pending || !canMoveUp}
              onClick={() => onMove?.("up")}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <ChevronUp aria-hidden="true" />
            </Button>
            <Button
              aria-label={`下移 ${category.name}`}
              disabled={pending || !canMoveDown}
              onClick={() => onMove?.("down")}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <ChevronDown aria-hidden="true" />
            </Button>
          </div>
        </>
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
