"use client";

import {
  Archive,
  Edit3,
  Loader2,
  ShieldAlert,
  Tags,
} from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
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
  categories: Category[];
  isAdmin: boolean;
  records: LedgerRecord[];
  roleLabel: string;
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
  categories,
  isAdmin,
  records,
  roleLabel,
}: CategoryManagementPanelProps) {
  const seededCategories = useMemo(
    () => seedEditableCategories(categories, records),
    [categories, records],
  );
  const [editableCategories, setEditableCategories] =
    useState(seededCategories);
  const [newType, setNewType] = useState<CategoryType>("expense");
  const [newName, setNewName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategories = editableCategories.filter(
    (category) => category.status === "active",
  );
  const archivedCategories = editableCategories.filter(
    (category) => category.status === "archived",
  );
  const editingCategory =
    editableCategories.find((category) => category.id === editingId) ?? null;
  const archivingCategory =
    editableCategories.find((category) => category.id === archivingId) ?? null;

  useEffect(() => {
    function openCreateDialog() {
      if (!isAdmin) {
        return;
      }

      setIsCreateDialogOpen(true);
    }

    window.addEventListener(OPEN_CATEGORY_CREATE_EVENT, openCreateDialog);
    return () => {
      window.removeEventListener(OPEN_CATEGORY_CREATE_EVENT, openCreateDialog);
    };
  }, [isAdmin]);

  function submitCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) {
      toast.error("只有管理者可以新增分類。");
      return;
    }

    const normalizedName = newName.trim();

    if (!normalizedName) {
      toast.error("請輸入分類名稱。");
      return;
    }

    if (hasDuplicateActiveName(editableCategories, newType, normalizedName)) {
      toast.error("同類型已有啟用中的相同分類名稱。");
      return;
    }

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

  function submitRenameCategory(category: EditableCategory) {
    if (!isAdmin) {
      toast.error("只有管理者可以修改分類。");
      return;
    }

    const normalizedName = editingName.trim();

    if (!normalizedName) {
      toast.error("請輸入分類名稱。");
      return;
    }

    if (
      hasDuplicateActiveName(
        editableCategories.filter((candidate) => candidate.id !== category.id),
        category.type,
        normalizedName,
      )
    ) {
      toast.error("同類型已有啟用中的相同分類名稱。");
      return;
    }

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

  function confirmArchiveCategory(category: EditableCategory) {
    if (!isAdmin) {
      toast.error("只有管理者可以封存分類。");
      return;
    }

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

  if (!isAdmin) {
    return <DeniedCategoryAccess roleLabel={roleLabel} />;
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
            hasAnyCategory={editableCategories.length > 0}
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
              isSubmitting={false}
              name={editingName}
              onNameChange={setEditingName}
              onSubmit={(event) => {
                event.preventDefault();
                submitRenameCategory(editingCategory);
              }}
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
                <Button
                  onClick={() => confirmArchiveCategory(archivingCategory)}
                  type="button"
                  variant="destructive"
                >
                  <Archive aria-hidden="true" />
                  確認封存
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeniedCategoryAccess({ roleLabel }: { roleLabel: string }) {
  return (
    <section aria-labelledby="denied-title" className="mt-5">
      <Card>
        <CardContent className="grid min-h-72 place-items-center text-center">
          <div className="max-w-md">
            <ShieldAlert
              aria-hidden="true"
              className="mx-auto mb-4 text-destructive"
              size={34}
            />
            <Badge variant="destructive">{roleLabel}</Badge>
            <h3 id="denied-title" className="mt-4 text-subheading">
              無法瀏覽分類管理
            </h3>
            <p className="mt-2 text-body text-muted-foreground">
              只有管理者可以看到分類入口，並新增、修改或封存收入與支出分類。
            </p>
            <Button asChild className="mt-5" variant="secondary">
              <Link href="/">返回月報</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
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
  isSubmitting,
  name,
  onNameChange,
  onSubmit,
  onTypeChange,
  submitLabel,
  type,
  typeDisabled = false,
}: {
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
    <form className="grid gap-4" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="category-type">類型</FieldLabel>
          <NativeSelect
            disabled={typeDisabled}
            id="category-type"
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
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="例如：水電費"
            value={name}
          />
          <FieldDescription>
            同一類型中，啟用分類不可重複命名。
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
  records: LedgerRecord[],
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
