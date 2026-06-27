import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export const RECURRING_PROTOTYPE_RECORD_ID_PREFIX = "prototype-recurring-";

const recurringPrototypeRuleSpecs = [
  {
    amountCents: 1800000,
    day: "01",
    key: "rent",
    name: "成員 A 房租收入",
    postingMode: "reminder",
    scheduleLabel: "每月 1 號",
    type: "income",
  },
  {
    amountCents: 129900,
    day: "15",
    key: "network",
    name: "網路費",
    postingMode: "immediate",
    scheduleLabel: "每月 15 號",
    type: "expense",
  },
] as const;

export function isRecurringPrototypeRecord(recordId: string): boolean {
  return recordId.startsWith(RECURRING_PROTOTYPE_RECORD_ID_PREFIX);
}

export function isRecurringPrototypeReminderRecord(recordId: string): boolean {
  return recurringPrototypeRuleSpecs.some((spec) =>
    spec.postingMode === "reminder" &&
    recordId.startsWith(`${RECURRING_PROTOTYPE_RECORD_ID_PREFIX}${spec.key}-`),
  );
}

export function recurringPrototypeEventLabel(recordId: string): string | undefined {
  const spec = recurringPrototypeRuleSpecs.find((candidate) =>
    recordId.startsWith(`${RECURRING_PROTOTYPE_RECORD_ID_PREFIX}${candidate.key}-`),
  );

  if (!spec) {
    return undefined;
  }

  return `${spec.scheduleLabel}，${postingModeLabel(spec.postingMode)}`;
}

export function buildRecurringPrototypeRecords({
  categories,
  members,
  month,
}: {
  categories: Category[];
  members: { displayName: string; id: string }[];
  month: string;
}): LedgerRecord[] {
  const incomeCategory = categories.find((category) =>
    category.type === "income" && category.status === "active",
  ) ?? categories.find((category) => category.type === "income");
  const expenseCategory = categories.find((category) =>
    category.type === "expense" && category.status === "active",
  ) ?? categories.find((category) => category.type === "expense");
  const sourceMember = members[0];
  const payerMember = members[1] ?? members[0];

  return [
    ...(incomeCategory && sourceMember
      ? [{
          amountCents: recurringPrototypeRuleSpecs[0].amountCents,
          categoryId: incomeCategory.id,
          createdByMemberId: sourceMember.id,
          id: `${RECURRING_PROTOTYPE_RECORD_ID_PREFIX}${recurringPrototypeRuleSpecs[0].key}-${month}`,
          name: recurringPrototypeRuleSpecs[0].name,
          note: "週期事件：每月 1 號，提醒入帳。這筆尚未確認前不應計入月報總額。",
          occurredOn: `${month}-${recurringPrototypeRuleSpecs[0].day}`,
          reimbursementStatus: "not_applicable" as const,
          sourceMemberId: sourceMember.id,
          status: "active" as const,
          type: recurringPrototypeRuleSpecs[0].type,
        }]
      : []),
    ...(expenseCategory && payerMember
      ? [{
          amountCents: recurringPrototypeRuleSpecs[1].amountCents,
          categoryId: expenseCategory.id,
          createdByMemberId: payerMember.id,
          id: `${RECURRING_PROTOTYPE_RECORD_ID_PREFIX}${recurringPrototypeRuleSpecs[1].key}-${month}`,
          name: recurringPrototypeRuleSpecs[1].name,
          note: "週期事件：每月 15 號，馬上入帳。成員代墊後會進入待退款流程。",
          occurredOn: `${month}-${recurringPrototypeRuleSpecs[1].day}`,
          payerMemberId: payerMember.id,
          paymentSource: "member" as const,
          reimbursementStatus: "refundable" as const,
          status: "active" as const,
          type: recurringPrototypeRuleSpecs[1].type,
        }]
      : []),
  ];
}

function postingModeLabel(mode: (typeof recurringPrototypeRuleSpecs)[number]["postingMode"]) {
  return mode === "immediate" ? "馬上入帳" : "提醒入帳";
}
