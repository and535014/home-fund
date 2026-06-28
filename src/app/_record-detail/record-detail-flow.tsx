"use client";

import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import {
  isPendingRecurringOccurrenceRecord,
  pendingRecurringOccurrenceIdFromRecordId,
} from "@/modules/recurring/recurring-occurrence-query";
import { RecordDetailDialog } from "./record-detail-dialog";
import {
  LinkedRecordsDialog,
  ReimbursementPaymentDetailDialog,
} from "./reimbursement-payment-dialogs";
import type { ReimbursementPaymentSearchResult } from "./reimbursement-payment-ui";
import { loadReimbursementPaymentForLedgerRecord } from "./reimbursement-payment-loader";

export function useRecordDetailFlow({
  loadPaymentForRecord = loadReimbursementPaymentForLedgerRecord,
  onPaymentUpdated,
  onRefresh,
  pendingRecurringRecordIds = [],
  records,
}: {
  loadPaymentForRecord?: (
    record: LedgerRecord,
    onLoaded: (payment: ReimbursementPaymentSearchResult) => void,
  ) => void;
  onPaymentUpdated?: (record: ReimbursementPaymentSearchResult) => void;
  onRefresh: () => void;
  pendingRecurringRecordIds?: string[];
  records: LedgerRecord[];
}) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRelatedRecord, setSelectedRelatedRecord] =
    useState<LedgerRecord | null>(null);
  const [selectedPaymentResult, setSelectedPaymentResult] =
    useState<ReimbursementPaymentSearchResult | null>(null);
  const [selectedPaymentLinkedResult, setSelectedPaymentLinkedResult] =
    useState<ReimbursementPaymentSearchResult | null>(null);
  const [isSelectedRecordPending, setIsSelectedRecordPending] = useState(false);
  const [confirmedRecurringRecordIds, setConfirmedRecurringRecordIds] = useState<
    Set<string>
  >(() => new Set());
  const selectedRecordTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ??
    selectedRelatedRecord;
  const pendingRecurringRecordIdSet = new Set(pendingRecurringRecordIds);

  function isPendingRecurringRecord(record: LedgerRecord): boolean {
    return pendingRecurringRecordIdSet.has(record.id) &&
      !confirmedRecurringRecordIds.has(record.id);
  }

  function recurringEventLabel(record: LedgerRecord): string | undefined {
    return isPendingRecurringOccurrenceRecord(record)
      ? record.recurringEventLabel
      : undefined;
  }

  function closeSelectedRecord() {
    setIsSelectedRecordPending(false);
    setSelectedRecordId(null);
    setSelectedRelatedRecord(null);
    window.requestAnimationFrame(() => {
      selectedRecordTriggerRef.current?.focus();
    });
  }

  function openRecord(recordId: string, trigger?: HTMLButtonElement) {
    if (trigger) {
      selectedRecordTriggerRef.current = trigger;
    }

    setSelectedRelatedRecord(null);
    setSelectedRecordId(recordId);
  }

  function openRelatedRecord(record: LedgerRecord) {
    setSelectedPaymentLinkedResult(null);
    setSelectedRelatedRecord(record);
    setSelectedRecordId(record.id);
  }

  function openPaymentResult(result: ReimbursementPaymentSearchResult) {
    setSelectedPaymentResult(result);
  }

  function openReimbursementPayment(record: LedgerRecord) {
    loadPaymentForRecord(record, (payment) => {
      setSelectedRecordId(null);
      setSelectedRelatedRecord(null);
      setSelectedPaymentResult(payment);
    });
  }

  function handlePaymentUpdated(record: ReimbursementPaymentSearchResult) {
    setSelectedPaymentResult(record);
    onPaymentUpdated?.(record);

    if (!onPaymentUpdated) {
      onRefresh();
    }
  }

  function handleRecordMutationSuccess() {
    closeSelectedRecord();
    onRefresh();
  }

  function confirmRecurringPosting(recordId: string) {
    setConfirmedRecurringRecordIds((current) => new Set([...current, recordId]));
    closeSelectedRecord();
  }

  function closeAll() {
    setIsSelectedRecordPending(false);
    setSelectedRecordId(null);
    setSelectedRelatedRecord(null);
    setSelectedPaymentResult(null);
    setSelectedPaymentLinkedResult(null);
  }

  return {
    closeAll,
    closeSelectedRecord,
    handlePaymentUpdated,
    handleRecordMutationSuccess,
    confirmRecurringPosting,
    isSelectedRecordPending,
    isPendingRecurringRecord,
    recurringEventLabel,
    onRefresh,
    openPaymentResult,
    openRecord,
    openReimbursementPayment,
    openRelatedRecord,
    selectedPaymentLinkedResult,
    selectedPaymentResult,
    selectedRecord,
    setIsSelectedRecordPending,
    setSelectedPaymentLinkedResult,
    setSelectedPaymentResult,
  };
}

export type RecordDetailFlowState = ReturnType<typeof useRecordDetailFlow>;

export function RecordDetailFlowDialogs({
  actor,
  canEditReimbursementPayments,
  categories,
  categoriesById,
  flow,
  memberNames,
}: {
  actor: HouseholdAccessProfile;
  canEditReimbursementPayments: boolean;
  categories: Category[];
  categoriesById: Record<string, Category>;
  flow: RecordDetailFlowState;
  memberNames: Record<string, string>;
}) {
  const selectedPaymentLinkedRecords =
    flow.selectedPaymentLinkedResult?.linkedRecords ?? [];

  return (
    <>
      <Dialog
        open={Boolean(flow.selectedRecord)}
        onOpenChange={(open) => {
          if (!open && !flow.isSelectedRecordPending) {
            flow.closeSelectedRecord();
          }
        }}
      >
        {flow.selectedRecord ? (
          <RecordDetailDialog
            actor={actor}
            category={categoriesById[flow.selectedRecord.categoryId]}
            categories={categories}
            categoryName={
              categoriesById[flow.selectedRecord.categoryId]?.name ??
              flow.selectedRecord.categoryId
            }
            memberNames={memberNames}
            onConfirmRecurringPosting={() => {
              if (flow.selectedRecord) {
                flow.confirmRecurringPosting(flow.selectedRecord.id);
              }
            }}
            onMutationSuccess={flow.handleRecordMutationSuccess}
            onOpenReimbursementPayment={flow.openReimbursementPayment}
            onPendingChange={flow.setIsSelectedRecordPending}
            onRefresh={flow.onRefresh}
            record={flow.selectedRecord}
            recurringEventLabel={flow.recurringEventLabel(flow.selectedRecord)}
            recurringOccurrenceId={pendingRecurringOccurrenceIdFromRecordId(
              flow.selectedRecord.id,
            )}
            recurringPostingPending={flow.isPendingRecurringRecord(flow.selectedRecord)}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(flow.selectedPaymentResult)}
        onOpenChange={(open) => {
          if (!open) {
            flow.setSelectedPaymentResult(null);
          }
        }}
      >
        {flow.selectedPaymentResult ? (
          <ReimbursementPaymentDetailDialog
            canEdit={canEditReimbursementPayments}
            onOpenLinkedRecords={() => {
              flow.setSelectedPaymentLinkedResult(flow.selectedPaymentResult);
              flow.setSelectedPaymentResult(null);
            }}
            onUpdated={flow.handlePaymentUpdated}
            result={flow.selectedPaymentResult}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(flow.selectedPaymentLinkedResult)}
        onOpenChange={(open) => {
          if (!open) {
            flow.setSelectedPaymentLinkedResult(null);
          }
        }}
      >
        {flow.selectedPaymentLinkedResult ? (
          <LinkedRecordsDialog
            categoriesById={categoriesById}
            memberNames={memberNames}
            onOpenRecord={flow.openRelatedRecord}
            records={selectedPaymentLinkedRecords}
          />
        ) : null}
      </Dialog>
    </>
  );
}
