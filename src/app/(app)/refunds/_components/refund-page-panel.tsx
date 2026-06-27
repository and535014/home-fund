"use client";

import { CheckSquare, HandCoins } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BatchRefundDialog } from "@/app/(app)/search/_components/batch-refund-dialog";
import type { BatchRefundPageActionState } from "@/app/(app)/refunds/_actions/refund-page-actions";
import { SummaryAmountContent } from "@/app/summary-amount-content";
import { RecordResultsList } from "@/app/(app)/search/_components/record-results-list";
import { readBatchRefundPaymentFormData } from "@/app/_reimbursement/batch-refund-client";
import {
  RecordDetailFlowDialogs,
  useRecordDetailFlow,
} from "@/app/_record-detail/record-detail-flow";
import type { ReimbursementPaymentSearchResult } from "@/app/_record-detail/reimbursement-payment-ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import type { RefundPageData } from "@/modules/reimbursement/refund-page/refund-page-query";

export function RefundPagePanel({
  actor,
  canEditReimbursementPayments,
  data,
  onBatchRefund,
}: {
  actor: HouseholdAccessProfile;
  canEditReimbursementPayments: boolean;
  data: RefundPageData;
  onBatchRefund: (input: {
    recordIds: string[];
    payment: {
      method?: string | null;
      paidOn?: string | null;
      note?: string | null;
    };
  }) => Promise<BatchRefundPageActionState>;
}) {
  const router = useRouter();
  const [scope, setScope] = useState("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const categoriesById = useMemo(
    () => Object.fromEntries(data.categories.map((category) => [category.id, category])),
    [data.categories],
  );
  const memberNames = useMemo(
    () =>
      Object.fromEntries(
        data.members
          .filter((member) => member.id !== "all")
          .map((member) => [member.id, member.name]),
      ),
    [data.members],
  );
  const scopedLedgerRecords = useMemo(
    () => filterRecordsByScope(data.unpaidExpenses, scope),
    [data.unpaidExpenses, scope],
  );
  const scopedPaymentResults = useMemo(
    () => filterPaymentsByScope(data.refundRecords, scope),
    [data.refundRecords, scope],
  );
  const selectedLedgerRecords = scopedLedgerRecords.filter((record) =>
    selectedIds.includes(record.id),
  );
  const detailFlow = useRecordDetailFlow({
    onRefresh: () => router.refresh(),
    records: scopedLedgerRecords,
  });
  const selectedRecordIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedTotalCents = selectedLedgerRecords.reduce(
    (total, record) => total + record.amountCents,
    0,
  );
  const summary = {
    unpaidCount: scopedLedgerRecords.length,
    unpaidAmountCents: scopedLedgerRecords.reduce(
      (total, record) => total + record.amountCents,
      0,
    ),
    refundedAmountCents: scopedPaymentResults.reduce(
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

  function selectScope(value: string) {
    setScope(value);
    setSelectedIds([]);
    setSelectionMode(false);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function completeBatchRefund(records: LedgerRecord[], formData: FormData) {
    const recordIds = records.map((record) => record.id);

    startTransition(() => {
      onBatchRefund({
        recordIds,
        payment: readBatchRefundPaymentFormData(formData),
      }).then((actionState) => {
        if (actionState.status !== "success" || actionState.ok !== true) {
          toast.error(actionState.message ?? "批次退款失敗，請稍後再試。");
          return;
        }

        if (!actionState.data) {
          toast.error("批次退款已完成，但回傳資料不完整，請重新整理確認狀態。");
          router.refresh();
          return;
        }

        toast.success("已完成批次退款", {
          description: `已處理 ${actionState.data.processedCount} 筆，略過 ${actionState.data.skippedCount} 筆。`,
        });
        setConfirmOpen(false);
        setSelectedIds([]);
        setSelectionMode(false);
        router.refresh();
      });
    });
  }

  return (
    <>
      <Tabs
        className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5"
        onValueChange={selectScope}
        value={scope}
      >
        <div className="min-w-0 overflow-x-auto">
          <TabsList className="w-max min-w-full md:min-w-0" variant="line">
            {data.members.map((member) => (
              <TabsTrigger
                key={member.id}
                onClick={() => selectScope(member.id)}
                value={member.id}
              >
                {member.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent className="min-h-0" key={scope} value={scope}>
          <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:grid-rows-none">
            <section
              aria-label="未退款支出紀錄"
              className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-body-strong text-foreground">
                    未退款支出紀錄
                  </h3>
                  <div className="mt-1 min-w-0">
                    <SummaryAmountContent
                      amountToneClassName="text-expense"
                      className="w-fit justify-start"
                      label={
                        selectionMode
                          ? `已選取 ${selectedLedgerRecords.length} 筆`
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
                    aria-label={selectionMode ? "取消選取" : "選取"}
                    className="sm:h-9 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
                    onClick={toggleSelectionMode}
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <CheckSquare aria-hidden="true" className="sm:hidden" />
                    <span className="sr-only sm:not-sr-only">
                      {selectionMode ? "取消選取" : "選取"}
                    </span>
                  </Button>
                  {selectionMode ? (
                    <Button
                      aria-label="批次退款"
                      className="sm:h-9 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
                      disabled={selectedLedgerRecords.length === 0}
                      onClick={() => setConfirmOpen(true)}
                      size="icon-sm"
                      type="button"
                    >
                      <HandCoins aria-hidden="true" className="sm:hidden" />
                      <span className="sr-only sm:not-sr-only">批次退款</span>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1">
                <RecordResultsList
                  categoriesById={categoriesById}
                  emptyMessage="沒有未退款支出紀錄。"
                  hasMoreRecords={false}
                  memberNames={memberNames}
                  onLoadMoreRecords={() => undefined}
                  onOpenRecord={detailFlow.openRecord}
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
              className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden"
            >
              <div className="min-w-0">
                <h3 className="text-body-strong text-foreground">退款紀錄</h3>
                <div className="mt-1 min-w-0">
                  <SummaryAmountContent
                    amountToneClassName="text-primary"
                    className="w-fit justify-start"
                    label={`已退款 ${scopedPaymentResults.length} 筆`}
                    totalAmountCents={summary.refundedAmountCents}
                    totalCount={scopedPaymentResults.length}
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <RecordResultsList
                  categoriesById={categoriesById}
                  emptyMessage="沒有退款紀錄。"
                  hasMoreRecords={false}
                  memberNames={memberNames}
                  onLoadMoreRecords={() => undefined}
                  onOpenRecord={() => undefined}
                  onOpenPaymentResult={(resultId) => {
                    const result = scopedPaymentResults.find(
                      (candidate) => candidate.id === resultId,
                    );

                    if (result) {
                      detailFlow.openPaymentResult(result);
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
      </Tabs>

      <RecordDetailFlowDialogs
        actor={actor}
        canEditReimbursementPayments={canEditReimbursementPayments}
        categories={data.categories}
        categoriesById={categoriesById}
        flow={detailFlow}
        memberNames={memberNames}
      />
      <BatchRefundDialog
        actor={actor}
        isPending={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={completeBatchRefund}
        open={confirmOpen}
        records={selectedLedgerRecords}
      />
    </>
  );
}

function filterRecordsByScope(records: LedgerRecord[], scope: string) {
  if (scope === "all") {
    return records;
  }

  return records.filter(
    (record) => record.type === "expense" && record.payerMemberId === scope,
  );
}

function filterPaymentsByScope(
  records: ReimbursementPaymentSearchResult[],
  scope: string,
) {
  if (scope === "all") {
    return records;
  }

  return records.filter((record) => record.paidToMemberId === scope);
}
