import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Category } from "@/modules/categorization/category-catalog";
import {
  loadHouseholdCategories,
} from "@/modules/categorization/category-query";
import {
  mapPrismaLedgerRecordToLedgerRecord,
  prismaLedgerRecordSelect,
} from "@/modules/fund-ledger/ledger-record-prisma-adapter";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import {
  loadHouseholdMemberOptions,
} from "@/modules/identity-access/household-member-query";
import {
  mapReimbursementPaymentSearchResult,
  reimbursementPaymentSelect,
  type ReimbursementPaymentSearchResult,
} from "@/modules/reimbursement/reimbursement-payment-search-query";

export type RefundPageMemberTab = {
  id: string;
  name: string;
};

export type RefundPageData = {
  month: string;
  memberId: string;
  members: RefundPageMemberTab[];
  categories: Category[];
  unpaidExpenses: LedgerRecord[];
  refundRecords: ReimbursementPaymentSearchResult[];
};

export type RefundPageQueryInput = {
  householdId: string;
  memberId?: string;
  month: string;
};

export async function loadRefundPageInDatabase({
  householdId,
  memberId = "all",
  month,
  prisma,
}: RefundPageQueryInput & {
  prisma: PrismaClient;
}): Promise<RefundPageData> {
  const unpaidWhere = buildRefundPageUnpaidExpenseWhere({
    householdId,
    memberId,
    month,
  });
  const paymentWhere = buildRefundPagePaymentWhere({
    householdId,
    memberId,
    month,
  });
  const [
    memberRows,
    categoryRows,
    unpaidRows,
    paymentRows,
  ] = await Promise.all([
    loadHouseholdMemberOptions({ householdId, prisma }),
    loadHouseholdCategories({ householdId, prisma }),
    prisma.ledgerRecord.findMany({
      where: unpaidWhere,
      orderBy: [{ occurredOn: "desc" }, { id: "desc" }],
      select: prismaLedgerRecordSelect,
    }),
    prisma.reimbursementPayment.findMany({
      where: paymentWhere,
      orderBy: [{ paidOn: "desc" }, { id: "desc" }],
      select: reimbursementPaymentSelect,
    }),
  ]);

  return {
    month,
    memberId,
    members: [
      { id: "all", name: "全部" },
      ...memberRows.map((member) => ({
        id: member.id,
        name: member.displayName,
      })),
    ],
    categories: categoryRows,
    unpaidExpenses: unpaidRows.map(mapPrismaLedgerRecordToLedgerRecord),
    refundRecords: paymentRows.map(mapReimbursementPaymentSearchResult),
  };
}

export function buildRefundPageUnpaidExpenseWhere({
  householdId,
  memberId = "all",
  month,
}: RefundPageQueryInput): Prisma.LedgerRecordWhereInput {
  return {
    householdId,
    status: "active",
    type: "expense",
    paymentSource: "member",
    reimbursementStatus: "refundable",
    occurredOn: monthRange(month),
    ...(memberId === "all" ? {} : { payerMemberId: memberId }),
  };
}

export function buildRefundPagePaymentWhere({
  householdId,
  memberId = "all",
  month,
}: RefundPageQueryInput): Prisma.ReimbursementPaymentWhereInput {
  return {
    householdId,
    paidOn: monthRange(month),
    ...(memberId === "all" ? {} : { paidToMemberId: memberId }),
  };
}

function monthRange(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  return {
    gte: new Date(Date.UTC(year, monthIndex, 1)),
    lt: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}
