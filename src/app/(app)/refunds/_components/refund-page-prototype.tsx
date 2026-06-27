"use client";

import { useMemo, useState } from "react";
import { BatchRefundDialog } from "@/app/(app)/search/_components/batch-refund-dialog";
import { SearchSummaryContent } from "@/app/(app)/search/_components/batch-search-footer";
import { RecordSearchResults } from "@/app/(app)/search/_components/record-search-results";
import { RecordDetailDialog } from "@/app/_record-detail/record-list-detail";
import {
  LinkedRecordsDialog,
  ReimbursementPaymentDetailDialog,
} from "@/app/_record-detail/reimbursement-payment-dialogs";
import type { ReimbursementPaymentSearchResult } from "@/app/_record-detail/reimbursement-payment-ui";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

type Member = {
  id: string;
  name: string;
};

type UnpaidExpense = {
  id: string;
  memberId: string;
  title: string;
  category: string;
  occurredOn: string;
  amountCents: number;
  note: string;
};

type RefundRecord = {
  id: string;
  memberId: string;
  title: string;
  paidOn: string;
  method: string;
  amountCents: number;
  linkedCount: number;
  note: string;
};

const members: Member[] = [
  { id: "all", name: "全部" },
  { id: "member-lin", name: "Lin" },
  { id: "member-wu", name: "Wu" },
  { id: "member-chen", name: "Chen" },
];

const unpaidExpenses: UnpaidExpense[] = [
  {
    id: "expense-1",
    memberId: "member-lin",
    title: "全聯晚餐採買",
    category: "餐飲",
    occurredOn: "2026-06-05",
    amountCents: 128000,
    note: "家庭聚餐食材",
  },
  {
    id: "expense-2",
    memberId: "member-lin",
    title: "停車費",
    category: "交通",
    occurredOn: "2026-06-08",
    amountCents: 36000,
    note: "週末出遊停車",
  },
  {
    id: "expense-3",
    memberId: "member-wu",
    title: "貓砂補貨",
    category: "日用品",
    occurredOn: "2026-06-12",
    amountCents: 95000,
    note: "例行補貨",
  },
  {
    id: "expense-4",
    memberId: "member-chen",
    title: "瓦斯費代墊",
    category: "居家",
    occurredOn: "2026-06-18",
    amountCents: 72000,
    note: "六月帳單",
  },
];

const refundRecords: RefundRecord[] = [
  {
    id: "refund-1",
    memberId: "member-lin",
    title: "退款給 Lin",
    paidOn: "2026-06-10",
    method: "銀行轉帳",
    amountCents: 210000,
    linkedCount: 3,
    note: "六月第一批退款",
  },
  {
    id: "refund-2",
    memberId: "member-wu",
    title: "退款給 Wu",
    paidOn: "2026-06-14",
    method: "現金",
    amountCents: 64000,
    linkedCount: 1,
    note: "早餐代墊",
  },
  {
    id: "refund-3",
    memberId: "member-chen",
    title: "退款給 Chen",
    paidOn: "2026-06-21",
    method: "其他",
    amountCents: 150000,
    linkedCount: 2,
    note: "家用品合併退款",
  },
];

const prototypeCategories: Category[] = [
  {
    id: "category-food",
    type: "expense",
    name: "餐飲",
    color: "gold",
    icon: "utensils",
    sortOrder: 1,
    status: "active",
  },
  {
    id: "category-traffic",
    type: "expense",
    name: "交通",
    color: "blue",
    icon: "bus",
    sortOrder: 2,
    status: "active",
  },
  {
    id: "category-supplies",
    type: "expense",
    name: "日用品",
    color: "teal",
    icon: "shopping-cart",
    sortOrder: 3,
    status: "active",
  },
  {
    id: "category-home",
    type: "expense",
    name: "居家",
    color: "violet",
    icon: "home",
    sortOrder: 4,
    status: "active",
  },
];

const categoriesByName = Object.fromEntries(
  prototypeCategories.map((category) => [category.name, category]),
);
const prototypeCategoriesById = Object.fromEntries(
  prototypeCategories.map((category) => [category.id, category]),
);
const prototypeMemberNames = Object.fromEntries(
  members
    .filter((member) => member.id !== "all")
    .map((member) => [member.id, member.name]),
);
const prototypeActor: HouseholdAccessProfile = {
  id: "member-finance",
  householdId: "prototype-household",
  displayName: "Finance",
  roles: ["finance_manager"],
  capabilities: [],
};
const prototypeDetailActor: HouseholdAccessProfile = {
  id: "member-admin",
  householdId: "prototype-household",
  displayName: "Admin",
  roles: ["admin"],
  capabilities: [],
};

export function RefundPagePrototype() {
  const [scope, setScope] = useState("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDetailRecord, setSelectedDetailRecord] =
    useState<LedgerRecord | null>(null);
  const [selectedPaymentResult, setSelectedPaymentResult] =
    useState<ReimbursementPaymentSearchResult | null>(null);
  const [selectedPaymentLinkedResult, setSelectedPaymentLinkedResult] =
    useState<ReimbursementPaymentSearchResult | null>(null);
  const [isSelectedRecordPending, setIsSelectedRecordPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const scopedUnpaidExpenses = useMemo(
    () => filterByScope(unpaidExpenses, scope),
    [scope],
  );
  const scopedRefundRecords = useMemo(
    () => filterByScope(refundRecords, scope),
    [scope],
  );
  const scopedLedgerRecords = useMemo(
    () => scopedUnpaidExpenses.map(mapUnpaidExpenseToLedgerRecord),
    [scopedUnpaidExpenses],
  );
  const scopedPaymentResults = useMemo(
    () => scopedRefundRecords.map(mapRefundRecordToPaymentResult),
    [scopedRefundRecords],
  );
  const selectedExpenses = scopedUnpaidExpenses.filter((expense) =>
    selectedIds.includes(expense.id),
  );
  const selectedLedgerRecords = scopedLedgerRecords.filter((record) =>
    selectedIds.includes(record.id),
  );
  const selectedPaymentLinkedRecords =
    selectedPaymentLinkedResult?.linkedRecords ?? [];
  const selectedRecordIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedTotalCents = selectedExpenses.reduce(
    (total, expense) => total + expense.amountCents,
    0,
  );
  const summary = {
    unpaidCount: scopedUnpaidExpenses.length,
    unpaidAmountCents: scopedUnpaidExpenses.reduce(
      (total, expense) => total + expense.amountCents,
      0,
    ),
    refundedAmountCents: scopedRefundRecords.reduce(
      (total, record) => total + record.amountCents,
      0,
    ),
  };

  function toggleSelectionMode() {
    setSelectionMode((current) => {
      if (current) {
        setSelectedIds([]);
      }

      return !current;
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  return (
    <>
      <Tabs
        className="gap-5 md:h-full md:min-h-0 md:grid-rows-[auto_minmax(0,1fr)]"
        onValueChange={(value) => {
          setScope(value);
          setSelectedIds([]);
          setSelectionMode(false);
        }}
        value={scope}
      >
        <div className="min-w-0 overflow-x-auto">
          <TabsList className="w-max min-w-full md:min-w-0" variant="line">
            {members.map((member) => (
              <TabsTrigger key={member.id} value={member.id}>
                {member.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {members.map((member) => (
          <TabsContent
            className="md:min-h-0"
            key={member.id}
            value={member.id}
          >
            <div className="grid gap-5 md:h-full md:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <section
                aria-label="未退款支出紀錄"
                className="flex min-w-0 flex-col gap-3 md:h-full md:min-h-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-body-strong text-foreground">
                      未退款支出紀錄
                    </h3>
                    <div className="mt-1 min-w-0">
                      <SearchSummaryContent
                        amountToneClassName="text-expense"
                        className="w-fit justify-start"
                        label={
                          selectionMode
                            ? `已選取 ${selectedExpenses.length} 筆`
                            : `未退款 ${summary.unpaidCount} 筆`
                        }
                        totalAmountCents={
                          selectionMode
                            ? selectedTotalCents
                            : summary.unpaidAmountCents
                        }
                        totalCount={summary.unpaidCount}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={toggleSelectionMode}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {selectionMode ? "取消選取" : "選取"}
                    </Button>
                    {selectionMode ? (
                      <Button
                        disabled={selectedExpenses.length === 0}
                        onClick={() => setConfirmOpen(true)}
                        size="sm"
                        type="button"
                      >
                        批次退款
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1">
                  <RecordSearchResults
                    categoriesById={prototypeCategoriesById}
                    emptyMessage="沒有未退款支出紀錄。"
                    hasMoreRecords={false}
                    memberNames={prototypeMemberNames}
                    onLoadMoreRecords={() => undefined}
                    onOpenRecord={(recordId) => {
                      const record = scopedLedgerRecords.find(
                        (candidate) => candidate.id === recordId,
                      );

                      if (record) {
                        setSelectedDetailRecord(record);
                      }
                    }}
                    onOpenPaymentResult={() => undefined}
                    onToggleRecordSelection={
                      selectionMode ? toggleSelected : undefined
                    }
                    paymentResults={[]}
                    records={scopedLedgerRecords}
                    selectedRecordIds={selectedRecordIdSet}
                  />
                </div>
              </section>

              <section
                aria-label="退款紀錄"
                className="flex min-w-0 flex-col gap-3 md:h-full md:min-h-0"
              >
                <div className="min-w-0">
                  <h3 className="text-body-strong text-foreground">退款紀錄</h3>
                  <div className="mt-1 min-w-0">
                    <SearchSummaryContent
                      amountToneClassName="text-primary"
                      className="w-fit justify-start"
                      label={`已退款 ${scopedRefundRecords.length} 筆`}
                      totalAmountCents={summary.refundedAmountCents}
                      totalCount={scopedRefundRecords.length}
                    />
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <RecordSearchResults
                    categoriesById={prototypeCategoriesById}
                    emptyMessage="沒有退款紀錄。"
                    hasMoreRecords={false}
                    memberNames={prototypeMemberNames}
                    onLoadMoreRecords={() => undefined}
                    onOpenRecord={() => undefined}
                    onOpenPaymentResult={(resultId) => {
                      const result = scopedPaymentResults.find(
                        (candidate) => candidate.id === resultId,
                      );

                      if (result) {
                        setSelectedPaymentResult(result);
                      }
                    }}
                    paymentResults={scopedPaymentResults}
                    records={[]}
                    selectedRecordIds={undefined}
                  />
                </div>
              </section>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog
        open={Boolean(selectedDetailRecord)}
        onOpenChange={(open) => {
          if (!open && !isSelectedRecordPending) {
            setSelectedDetailRecord(null);
          }
        }}
      >
        {selectedDetailRecord ? (
          <RecordDetailDialog
            actor={prototypeDetailActor}
            category={prototypeCategoriesById[selectedDetailRecord.categoryId]}
            categories={prototypeCategories}
            categoryName={
              prototypeCategoriesById[selectedDetailRecord.categoryId]?.name ??
              selectedDetailRecord.categoryId
            }
            memberNames={prototypeMemberNames}
            onMutationSuccess={() => setSelectedDetailRecord(null)}
            onPendingChange={setIsSelectedRecordPending}
            onRefresh={() => undefined}
            record={selectedDetailRecord}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(selectedPaymentResult)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaymentResult(null);
          }
        }}
      >
        {selectedPaymentResult ? (
          <ReimbursementPaymentDetailDialog
            onOpenLinkedRecords={() => {
              setSelectedPaymentLinkedResult(selectedPaymentResult);
              setSelectedPaymentResult(null);
            }}
            result={selectedPaymentResult}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(selectedPaymentLinkedResult)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaymentLinkedResult(null);
          }
        }}
      >
        {selectedPaymentLinkedResult ? (
          <LinkedRecordsDialog
            categoriesById={prototypeCategoriesById}
            memberNames={prototypeMemberNames}
            onOpenRecord={(record) => {
              setSelectedPaymentLinkedResult(null);
              setSelectedDetailRecord(record);
            }}
            records={selectedPaymentLinkedRecords}
          />
        ) : null}
      </Dialog>
      <BatchRefundDialog
        actor={prototypeActor}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setSelectedIds([]);
          setSelectionMode(false);
        }}
        open={confirmOpen}
        records={selectedLedgerRecords}
      />
    </>
  );
}

function filterByScope<T extends { memberId: string }>(items: T[], scope: string) {
  return scope === "all" ? items : items.filter((item) => item.memberId === scope);
}

function memberName(memberId: string) {
  return members.find((member) => member.id === memberId)?.name ?? "未知成員";
}

function mapUnpaidExpenseToLedgerRecord(expense: UnpaidExpense): LedgerRecord {
  const category = categoriesByName[expense.category] ?? prototypeCategories[0];

  return {
    id: expense.id,
    type: "expense",
    name: expense.title,
    amountCents: expense.amountCents,
    occurredOn: expense.occurredOn,
    categoryId: category.id,
    createdByMemberId: expense.memberId,
    paymentSource: "member",
    payerMemberId: expense.memberId,
    note: expense.note,
    reimbursementStatus: "refundable",
    status: "active",
  };
}

function mapRefundRecordToPaymentResult(
  record: RefundRecord,
): ReimbursementPaymentSearchResult {
  const linkedRecords = unpaidExpenses
    .filter((expense) => expense.memberId === record.memberId)
    .slice(0, record.linkedCount)
    .map(mapUnpaidExpenseToLedgerRecord);

  return {
    id: record.id,
    reimbursementBatchId: `${record.id}-batch`,
    amountCents: record.amountCents,
    paidOn: record.paidOn,
    paidToMemberId: record.memberId,
    paidToMemberName: memberName(record.memberId),
    method: refundMethodValue(record.method),
    methodLabel: refundMethodLabel(record.method),
    note: record.note,
    linkedRecordNames: linkedRecords.map((linkedRecord) => linkedRecord.name),
    primaryLinkedRecordName: linkedRecords[0]?.name ?? record.title,
    linkedRecords,
  };
}

function refundMethodValue(
  method: string,
): ReimbursementPaymentSearchResult["method"] {
  if (method === "銀行轉帳") {
    return "bank_transfer";
  }

  if (method === "現金") {
    return "cash";
  }

  return "other";
}

function refundMethodLabel(
  method: string,
): ReimbursementPaymentSearchResult["methodLabel"] {
  if (method === "銀行轉帳" || method === "現金") {
    return method;
  }

  return "其他";
}
