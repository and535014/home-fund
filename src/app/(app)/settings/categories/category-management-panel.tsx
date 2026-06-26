"use client";

import { Archive } from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { initialActionState } from "@/app/action-state";
import {
  archiveCategoryAction,
  createCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
  type ArchiveCategoryActionState,
  type CreateCategoryActionState,
  type ReorderCategoryActionState,
  type UpdateCategoryActionState,
} from "@/app/category-actions";
import {
  CATEGORY_COLOR_OPTIONS,
  compareCategoryVisualOrder,
  type CategoryIconKey,
} from "@/app/category-visuals";
import {
  AddCategoryHeaderButton as AddCategoryHeaderButtonView,
  AddCategoryMobileFab as AddCategoryMobileFabView,
  CategoryArchivePreview,
  CategoryArchiveVisibilitySwitch,
  CategoryEmptyState,
  CategoryForm,
  CategoryList,
  CategoryPanel,
} from "@/app/(app)/settings/categories/category-management-ui";
import type { CategoryColorKey } from "@/modules/categorization/category-visual-options";
import type { Category } from "@/modules/categorization/category-catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CategoryType = Category["type"];

export type EditableCategory = Category & {
  recordCount: number;
};

type CategoryManagementPanelProps = {
  categories: EditableCategory[];
};

const OPEN_CATEGORY_CREATE_EVENT = "home-fund:open-category-create";

function openCategoryCreateDialog() {
  window.dispatchEvent(new Event(OPEN_CATEGORY_CREATE_EVENT));
}

export function AddCategoryHeaderButton({
  className,
  size,
}: {
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
}) {
  return (
    <AddCategoryHeaderButtonView
      className={className}
      onOpen={openCategoryCreateDialog}
      size={size}
    />
  );
}

export function AddCategoryMobileFab() {
  return <AddCategoryMobileFabView onOpen={openCategoryCreateDialog} />;
}

export function CategoryManagementPanel({ categories }: CategoryManagementPanelProps) {
  const [newType, setNewType] = useState<CategoryType>("expense");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CategoryColorKey>(CATEGORY_COLOR_OPTIONS[0].value);
  const [newIcon, setNewIcon] = useState<CategoryIconKey>("tags");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState<CategoryColorKey>(
    CATEGORY_COLOR_OPTIONS[0].value,
  );
  const [editingIcon, setEditingIcon] = useState<CategoryIconKey>("tags");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showArchivedCategories, setShowArchivedCategories] = useState(false);
  const [displayedCategories, setDisplayedCategories] = useState(categories);
  const [isPending, startTransition] = useTransition();

  const activeCategories = displayedCategories
    .filter((category) => category.status === "active")
    .sort(compareCategoryVisualOrder);
  const archivedCategories = displayedCategories
    .filter((category) => category.status === "archived")
    .sort(compareCategoryVisualOrder);
  const visibleCategories = showArchivedCategories
    ? [...activeCategories, ...archivedCategories]
    : activeCategories;
  const expenseCategories = visibleCategories.filter(
    (category) => category.type === "expense",
  );
  const incomeCategories = visibleCategories.filter(
    (category) => category.type === "income",
  );
  const archivedCount = archivedCategories.length;
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
    const formData = new FormData(event.currentTarget);

    if (!normalizedName) {
      toast.error("請輸入分類名稱。");
      return;
    }

    if (hasDuplicateActiveName(displayedCategories, newType, normalizedName)) {
      toast.error("同類型已有啟用中的相同分類名稱。");
      return;
    }

    startTransition(async () => {
      const result = await createCategoryAction(
        initialActionState() as CreateCategoryActionState,
        formData,
      );

      if (result.status === "error") {
        toast.error(result.message ?? "分類新增失敗。");
        return;
      }

      const data = result.data;

      if (data) {
        setDisplayedCategories((current) => [
          ...current,
          {
            color: data.color,
            icon: data.icon,
            id: data.categoryId,
            name: data.name,
            recordCount: 0,
            sortOrder: data.sortOrder,
            status: "active",
            type: data.type,
          },
        ]);
      }

      setNewName("");
      setIsCreateDialogOpen(false);
      toast.success(result.message ?? "分類已新增");
    });
  }

  function startRename(category: EditableCategory) {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingColor(category.color);
    setEditingIcon(category.icon);
  }

  function submitRenameCategory(
    event: FormEvent<HTMLFormElement>,
    category: EditableCategory,
  ) {
    event.preventDefault();
    const normalizedName = editingName.trim();
    const formData = new FormData(event.currentTarget);

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

    startTransition(async () => {
      const result = await updateCategoryAction(
        initialActionState() as UpdateCategoryActionState,
        formData,
      );

      if (result.status === "error") {
        toast.error(result.message ?? "分類更新失敗。");
        return;
      }

      setDisplayedCategories((current) =>
        current.map((candidate) =>
          candidate.id === category.id && result.data
            ? {
                ...candidate,
                color: result.data.color,
                icon: result.data.icon,
                name: result.data.name,
              }
            : candidate,
        ),
      );
      setEditingId(null);
      toast.success(result.message ?? "分類已更新");
    });
  }

  function startArchive(category: EditableCategory) {
    setArchivingId(category.id);
  }

  function confirmArchiveCategory() {
    if (archivingCategory) {
      const formData = new FormData();
      formData.set("categoryId", archivingCategory.id);

      startTransition(async () => {
        const result = await archiveCategoryAction(
          initialActionState() as ArchiveCategoryActionState,
          formData,
        );

        if (result.status === "error") {
          toast.error(result.message ?? "分類封存失敗。");
          return;
        }

        setDisplayedCategories((current) =>
          current.map((category) =>
            category.id === archivingCategory.id
              ? { ...category, status: "archived" }
              : category,
          ),
        );
        setEditingId(null);
        setArchivingId(null);
        toast.success(result.message ?? "分類已封存");
      });
    } else {
      setEditingId(null);
      setArchivingId(null);
    }
  }

  function unarchiveCategory(category: EditableCategory) {
    const activeTypeCategories = displayedCategories.filter(
      (candidate) =>
        candidate.type === category.type && candidate.status === "active",
    );

    if (hasDuplicateActiveName(displayedCategories, category.type, category.name)) {
      toast.error("同類型已有啟用中的相同分類名稱，請先調整分類名稱。");
      return;
    }

    const nextSortOrder =
      activeTypeCategories.reduce(
        (max, candidate) => Math.max(max, candidate.sortOrder),
        0,
      ) + 10;

    setDisplayedCategories((current) =>
      current.map((candidate) =>
        candidate.id === category.id
          ? { ...candidate, sortOrder: nextSortOrder, status: "active" }
          : candidate,
      ),
    );
    toast.success("分類已取消封存");
  }

  function persistCategoryOrder(type: CategoryType, orderedCategories: EditableCategory[]) {
    const formData = new FormData();
    formData.set("type", type);
    orderedCategories.forEach((category) => {
      formData.append("categoryIds", category.id);
    });

    startTransition(async () => {
      const result = await reorderCategoriesAction(
        initialActionState() as ReorderCategoryActionState,
        formData,
      );

      if (result.status === "error") {
        toast.error(result.message ?? "分類排序更新失敗。");
        setDisplayedCategories(categories);
      }
    });
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
    persistCategoryOrder(type, reordered);
  }

  return (
    <div className="grid h-full min-h-0 gap-5">
      <CategoryArchiveVisibilitySwitch
        checked={showArchivedCategories}
        onCheckedChange={setShowArchivedCategories}
      />
      <section
        aria-describedby="category-archive-visibility-note"
        aria-label="分類列表"
        className="grid min-h-0 gap-4 lg:grid-cols-2"
      >
        <p className="sr-only" id="category-archive-visibility-note">
          {showArchivedCategories
            ? "封存分類目前會顯示在各類型列表底部。"
            : "封存分類目前已隱藏。"}
        </p>
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
              onUnarchive={unarchiveCategory}
              pending={isPending}
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
              onUnarchive={unarchiveCategory}
              pending={isPending}
              type="income"
            />
          )}
        </CategoryPanel>
      </section>
      {showArchivedCategories && archivedCount === 0 ? (
        <p className="text-caption text-muted-foreground">
          目前沒有封存分類。
        </p>
      ) : null}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent aria-describedby={undefined}>
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
        <DialogContent aria-describedby={undefined}>
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
            <>
              <DialogBody>
                <CategoryArchivePreview category={archivingCategory} />
              </DialogBody>
              <DialogFooter>
                <Button
                  onClick={() => setArchivingId(null)}
                  disabled={isPending}
                  type="button"
                  variant="outline"
                >
                  取消
                </Button>
                <form onSubmit={(event) => event.preventDefault()}>
                  <div className="grid gap-2">
                    <input name="categoryId" type="hidden" value={archivingCategory.id} />
                    <Button disabled={isPending} onClick={confirmArchiveCategory} type="button" variant="destructive">
                      <Archive aria-hidden="true" />
                      確認封存
                    </Button>
                  </div>
                </form>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
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
    recordCount: recordCounts.get(category.id) ?? 0,
  }));
}

export function buildEditableCategories(
  categories: Category[],
  records: { categoryId: string }[],
): EditableCategory[] {
  return seedEditableCategories(categories, records);
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
