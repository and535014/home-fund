// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ReimbursementPaymentDetailDialog } from "./reimbursement-payment-dialogs";
import type { ReimbursementPaymentSearchResult } from "./reimbursement-payment-ui";
import { Dialog } from "@/components/ui/dialog";

vi.mock("./reimbursement-payment-edit-actions", () => ({
  editReimbursementPaymentFormAction: vi.fn(async (previousState) => previousState),
}));

const paymentResult: ReimbursementPaymentSearchResult = {
  id: "payment-1",
  reimbursementBatchId: "batch-1",
  amountCents: 424000,
  paidOn: "2026-06-21",
  paidToMemberId: "member-lin",
  paidToMemberName: "Lin",
  method: "bank_transfer",
  methodLabel: "銀行轉帳",
  note: "末五碼 12345",
  linkedRecordNames: ["晚餐代墊"],
  primaryLinkedRecordName: "晚餐代墊",
  linkedRecords: [],
};

describe("ReimbursementPaymentDetailDialog", () => {
  it("renders refund payment evidence fields", () => {
    renderPaymentDialog(
      <ReimbursementPaymentDetailDialog
        canEdit={false}
        onOpenLinkedRecords={() => undefined}
        result={paymentResult}
      />,
    );

    expect(screen.getByText("退款紀錄")).toBeTruthy();
    expect(screen.getByText("$4,240")).toBeTruthy();
    expect(screen.getByText("Lin")).toBeTruthy();
    expect(screen.getByText("2026/06/21")).toBeTruthy();
    expect(screen.getByText("銀行轉帳")).toBeTruthy();
    expect(screen.getByText("末五碼 12345")).toBeTruthy();
  });

  it("hides edit action when editing is not allowed", () => {
    renderPaymentDialog(
      <ReimbursementPaymentDetailDialog
        canEdit={false}
        onOpenLinkedRecords={() => undefined}
        result={paymentResult}
      />,
    );

    expect(screen.queryByRole("button", { name: /編輯/ })).toBeNull();
  });

  it("shows edit action when editing is allowed", () => {
    renderPaymentDialog(
      <ReimbursementPaymentDetailDialog
        canEdit
        onOpenLinkedRecords={() => undefined}
        result={paymentResult}
      />,
    );

    expect(screen.getByRole("button", { name: /編輯/ })).toBeTruthy();
  });

  it("opens linked records through the caller callback", () => {
    const onOpenLinkedRecords = vi.fn();

    renderPaymentDialog(
      <ReimbursementPaymentDetailDialog
        canEdit={false}
        onOpenLinkedRecords={onOpenLinkedRecords}
        result={paymentResult}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /查看關聯紀錄/ }));

    expect(onOpenLinkedRecords).toHaveBeenCalledTimes(1);
  });
});

function renderPaymentDialog(children: ReactNode) {
  return render(<Dialog open>{children}</Dialog>);
}
