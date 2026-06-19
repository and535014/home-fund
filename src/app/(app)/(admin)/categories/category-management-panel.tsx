"use client";

import {
  Archive,
  Edit3,
  Loader2,
  Tags,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  initialActionState,
  type ActionState,
  type FormAction,
} from "@/app/action-state";
import type {
  ArchiveCategoryActionField,
  CategoryActionCode,
  CreateCategoryActionField,
  RenameCategoryActionField,
} from "@/app/category-actions";
import type { Category } from "@/modules/categorization/category-catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CategoryType = Category["type"];

type EditableCategory = Category & {
  recordCount: number;
};

type CategoryManagementPanelProps = {
  archiveAction?: FormAction<
    { categoryId: string },
    ArchiveCategoryActionField,
    CategoryActionCode
  >;
  categories: EditableCategory[];
  createAction?: FormAction<
    { categoryId: string; name: string; type: CategoryType },
    CreateCategoryActionField,
    CategoryActionCode
  >;
  renameAction?: FormAction<
    { categoryId: string; name: string },
    RenameCategoryActionField,
    CategoryActionCode
  >;
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

export function CategoryManagementPanel({
  archiveAction,
  categories,
  createAction,
  renameAction,
}: CategoryManagementPanelProps) {
  const router = useRouter();
  const [createActionState, createFormAction] = useActionState(
    createAction ?? fallbackCreateCategoryAction,
    initialActionState<
      { categoryId: string; name: string; type: CategoryType },
      CreateCategoryActionField,
      CategoryActionCode
    >(),
  );
  const [renameActionState, renameFormAction] = useActionState(
    renameAction ?? fallbackRenameCategoryAction,
    initialActionState<
      { categoryId: string; name: string },
      RenameCategoryActionField,
      CategoryActionCode
    >(),
  );
  const [archiveActionState, archiveFormAction] = useActionState(
    archiveAction ?? fallbackArchiveCategoryAction,
    initialActionState<
      { categoryId: string },
      ArchiveCategoryActionField,
      CategoryActionCode
    >(),
  );
  const [editableCategories, setEditableCategories] = useState(categories);
  const [newType, setNewType] = useState<CategoryType>("expense");
  const [newName, setNewName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isServerBacked = Boolean(createAction && renameAction && archiveAction);
  const displayedCategories = isServerBacked ? categories : editableCategories;

  const activeCategories = displayedCategories.filter(
    (category) => category.status === "active",
  );
  const archivedCategories = displayedCategories.filter(
    (category) => category.status === "archived",
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

  useEffect(() => {
    showCategoryActionToast(createActionState, {
      successDescription: "已加入啟用分類。",
      successId: "category-created",
    });

    if (createActionState.status === "success") {
      router.refresh();
    }
  }, [createActionState, router]);

  useEffect(() => {
    showCategoryActionToast(renameActionState, {
      successDescription: "已更新分類名稱。",
      successId: "category-renamed",
    });

    if (renameActionState.status === "success") {
      router.refresh();
    }
  }, [renameActionState, router]);

  useEffect(() => {
    showCategoryActionToast(archiveActionState, {
      successDescription: "既有紀錄仍會保留原分類。",
      successId: "category-archived",
    });

    if (archiveActionState.status === "success") {
      router.refresh();
    }
  }, [archiveActionState, router]);

  function submitCreateCategory(event: FormEvent<HTMLFormElement>) {
    const normalizedName = newName.trim();

    if (!normalizedName) {
      event.preventDefault();
      toast.error("請輸入分類名稱。");
      return;
    }

    if (hasDuplicateActiveName(displayedCategories, newType, normalizedName)) {
      event.preventDefault();
      toast.error("同類型已有啟用中的相同分類名稱。");
      return;
    }

    if (isServerBacked) {
      setNewName("");
      setIsCreateDialogOpen(false);
      return;
    }

    event.preventDefault();
    setIsSubmitting(true);
    window.setTimeout(() => {
      setEditableCategories((currentCategories) => [
        ...currentCategories,
        {
          id: `${newType}-${Date.now()}`,
          type: newType,
          name: normalizedName,
          status: "active",
          recordCount: 0,
        },
      ]);
      setNewName("");
      setIsCreateDialogOpen(false);
      setIsSubmitting(false);
      toast.success("分類已新增", {
        description: "已加入啟用分類。",
        id: `create-category-${newType}-${normalizedName}`,
      });
    }, 360);
  }

  function startRename(category: EditableCategory) {
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function submitRenameCategory(
    event: FormEvent<HTMLFormElement>,
    category: EditableCategory,
  ) {
    const normalizedName = editingName.trim();

    if (!normalizedName) {
      event.preventDefault();
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
      event.preventDefault();
      toast.error("同類型已有啟用中的相同分類名稱。");
      return;
    }

    if (isServerBacked) {
      setEditingId(null);
      return;
    }

    event.preventDefault();
    setEditableCategories((currentCategories) =>
      currentCategories.map((candidate) =>
        candidate.id === category.id
          ? { ...candidate, name: normalizedName }
          : candidate,
      ),
    );
    setEditingId(null);
    toast.success("分類已更新", {
      description: "已更新分類名稱。",
      id: `rename-category-${category.id}`,
    });
  }

  function startArchive(category: EditableCategory) {
    setArchivingId(category.id);
  }

  function confirmArchiveCategory(
    event: FormEvent<HTMLFormElement>,
    category: EditableCategory,
  ) {
    if (isServerBacked) {
      setArchivingId(null);
      return;
    }

    event.preventDefault();
    setEditableCategories((currentCategories) =>
      currentCategories.map((candidate) =>
        candidate.id === category.id
          ? { ...candidate, status: "archived" }
          : candidate,
      ),
    );
    setEditingId(null);
    setArchivingId(null);
    toast.success("分類已封存", {
      description: "既有紀錄仍會保留原分類。",
      id: `archive-category-${category.id}`,
    });
  }

  return (
    <div className="grid gap-5">
      <section aria-label="分類列表" className="min-w-0">
        <Tabs defaultValue="active">
          <TabsList
            aria-label="分類狀態"
            className="w-full sm:w-auto"
            variant="line"
          >
            <TabsTrigger value="active">
              啟用分類 ({activeCategories.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              封存分類 ({archivedCategories.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <ActiveCategoryTab
              activeCategories={activeCategories}
              editingId={editingId}
              hasAnyCategory={displayedCategories.length > 0}
              onArchive={startArchive}
              onEdit={startRename}
            />
          </TabsContent>
          <TabsContent value="archived">
            <ArchivedCategoryTab archivedCategories={archivedCategories} />
          </TabsContent>
        </Tabs>
      </section>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增分類</DialogTitle>
            <DialogDescription>
              新增後立即成為新紀錄表單的可選分類。
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            action={createFormAction}
            fieldError={createActionState.fieldErrors?.name?.[0]}
            isSubmitting={isSubmitting}
            name={newName}
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
            <DialogDescription>
              修改啟用中的分類名稱；既有紀錄會顯示新的分類名稱。
            </DialogDescription>
          </DialogHeader>
          {editingCategory ? (
            <CategoryForm
              action={renameFormAction}
              categoryId={editingCategory.id}
              fieldError={renameActionState.fieldErrors?.name?.[0]}
              isSubmitting={false}
              name={editingName}
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
                <p className="text-body-strong">{archivingCategory.name}</p>
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
                <form
                  action={archiveFormAction}
                  onSubmit={(event) =>
                    confirmArchiveCategory(event, archivingCategory)
                  }
                >
                  <div className="grid gap-2">
                    <input name="categoryId" type="hidden" value={archivingCategory.id} />
                    {archiveActionState.fieldErrors?.categoryId?.[0] ? (
                      <p className="text-caption text-destructive">
                        {archiveActionState.fieldErrors.categoryId[0]}
                      </p>
                    ) : null}
                    <Button type="submit" variant="destructive">
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

function ActiveCategoryTab({
  activeCategories,
  editingId,
  hasAnyCategory,
  onArchive,
  onEdit,
}: {
  activeCategories: EditableCategory[];
  editingId: string | null;
  hasAnyCategory: boolean;
  onArchive: (category: EditableCategory) => void;
  onEdit: (category: EditableCategory) => void;
}) {
  if (!hasAnyCategory) {
    return (
      <Card>
        <CardContent className="grid min-h-52 place-items-center text-center">
          <div>
            <Tags
              aria-hidden="true"
              className="mx-auto mb-3 text-muted-foreground"
              size={28}
            />
            <p className="text-body-strong">尚未建立分類</p>
            <p className="mt-1 text-caption text-muted-foreground">
              建立第一個收入或支出分類後，新增紀錄才會出現可選項目。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CategoryGroup
        categories={activeCategories.filter(
          (category) => category.type === "income",
        )}
        editingId={editingId}
        onArchive={onArchive}
        onEdit={onEdit}
        title="收入分類"
        type="income"
      />
      <CategoryGroup
        categories={activeCategories.filter(
          (category) => category.type === "expense",
        )}
        editingId={editingId}
        onArchive={onArchive}
        onEdit={onEdit}
        title="支出分類"
        type="expense"
      />
    </div>
  );
}

function ArchivedCategoryTab({
  archivedCategories,
}: {
  archivedCategories: EditableCategory[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ArchivedCategoryGroup
        categories={archivedCategories.filter(
          (category) => category.type === "income",
        )}
        title="收入分類"
        type="income"
      />
      <ArchivedCategoryGroup
        categories={archivedCategories.filter(
          (category) => category.type === "expense",
        )}
        title="支出分類"
        type="expense"
      />
    </div>
  );
}

function CategoryForm({
  action,
  categoryId,
  fieldError,
  isSubmitting,
  name,
  onNameChange,
  onSubmit,
  onTypeChange,
  submitLabel,
  type,
  typeDisabled = false,
}: {
  action?: ComponentProps<"form">["action"];
  categoryId?: string;
  fieldError?: string;
  isSubmitting: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTypeChange: (type: CategoryType) => void;
  submitLabel: string;
  type: CategoryType;
  typeDisabled?: boolean;
}) {
  return (
    <form action={action} className="grid gap-4" onSubmit={onSubmit}>
      {categoryId ? <input name="categoryId" type="hidden" value={categoryId} /> : null}
      <FieldGroup>
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
          {typeDisabled ? (
            <FieldDescription>分類類型建立後不可在此切換。</FieldDescription>
          ) : null}
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
          <FieldDescription>
            {fieldError ?? "同一類型中，啟用分類不可重複命名。"}
          </FieldDescription>
        </Field>
      </FieldGroup>
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <Tags aria-hidden="true" />
        )}
        {submitLabel}
      </Button>
    </form>
  );
}

function CategoryGroup({
  categories,
  editingId,
  onArchive,
  onEdit,
  title,
  type,
}: {
  categories: EditableCategory[];
  editingId: string | null;
  onArchive: (category: EditableCategory) => void;
  onEdit: (category: EditableCategory) => void;
  title: string;
  type: CategoryType;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={type === "income" ? "text-income" : "text-expense"}>
            ●
          </span>
          {title} ({categories.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-caption text-muted-foreground">尚無啟用分類</p>
        ) : (
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
                key={category.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryItem({
  actions,
  category,
  statusLabel,
}: {
  actions?: ReactNode;
  category: EditableCategory;
  statusLabel?: string;
}) {
  return (
    <Item className="flex-nowrap bg-background" size="sm" variant="outline">
      <ItemContent className="min-w-0">
        <ItemTitle className="block w-auto truncate">{category.name}</ItemTitle>
      </ItemContent>
      {actions ? (
        <ItemActions className="shrink-0">{actions}</ItemActions>
      ) : null}
      {statusLabel ? (
        <ItemActions className="shrink-0">
          <Badge variant="outline">{statusLabel}</Badge>
        </ItemActions>
      ) : null}
    </Item>
  );
}

function ArchivedCategoryGroup({
  categories,
  title,
  type,
}: {
  categories: EditableCategory[];
  title: string;
  type: CategoryType;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={type === "income" ? "text-income" : "text-expense"}>
            ●
          </span>
          {title} ({categories.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="grid min-h-32 place-items-center text-center">
            <p className="text-caption text-muted-foreground">尚無封存分類</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {categories.map((category) => (
              <CategoryItem
                category={category}
                key={category.id}
                statusLabel="封存"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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

function showCategoryActionToast(
  state: ActionState<unknown, string, CategoryActionCode>,
  {
    successDescription,
    successId,
  }: {
    successDescription: string;
    successId: string;
  },
) {
  if (state.status === "success" && state.message) {
    toast.success(state.message, {
      description: successDescription,
      id: successId,
    });
    return;
  }

  if (state.status === "error" && state.message) {
    toast.error(state.message, {
      id: `category-${state.code ?? "unknown_error"}`,
    });
  }
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

async function fallbackCreateCategoryAction() {
  return initialActionState<
    { categoryId: string; name: string; type: CategoryType },
    CreateCategoryActionField,
    CategoryActionCode
  >();
}

async function fallbackRenameCategoryAction() {
  return initialActionState<
    { categoryId: string; name: string },
    RenameCategoryActionField,
    CategoryActionCode
  >();
}

async function fallbackArchiveCategoryAction() {
  return initialActionState<
    { categoryId: string },
    ArchiveCategoryActionField,
    CategoryActionCode
  >();
}
